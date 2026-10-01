import { COLLECTIONS, FUNCTIONS_REGION } from '@broadcast/shared'
import { getApps, initializeApp as initializeAdminApp } from 'firebase-admin/app'
import { getFirestore, Timestamp } from 'firebase-admin/firestore'
import { deleteApp, initializeApp, type FirebaseApp } from 'firebase/app'
import { connectAuthEmulator, createUserWithEmailAndPassword, getAuth } from 'firebase/auth'
import { connectFunctionsEmulator, getFunctions, httpsCallable } from 'firebase/functions'
import { afterAll, afterEach } from 'vitest'

// Same project the emulators are started with, so the web SDK and the Admin SDK see the same data.
const PROJECT_ID = 'demo-broadcast'
const HOUR_MS = 60 * 60 * 1000

if (getApps().length === 0) initializeAdminApp({ projectId: PROJECT_ID })

export const db = getFirestore()

const clearFirestore = () =>
  fetch(
    `http://${process.env.FIRESTORE_EMULATOR_HOST}/emulator/v1/projects/${PROJECT_ID}/databases/(default)/documents`,
    { method: 'DELETE' },
  )

const connect = (app: FirebaseApp) => {
  const functions = getFunctions(app, FUNCTIONS_REGION)
  connectFunctionsEmulator(functions, '127.0.0.1', 5001)
  return <Input, Result = void>(name: string, input: Input) =>
    httpsCallable<Input, Result>(functions, name)(input).then((result) => result.data)
}

export const setupFunctionsEnv = () => {
  const apps: FirebaseApp[] = []
  const newApp = () => {
    const app = initializeApp({ projectId: PROJECT_ID, apiKey: 'fake-api-key' }, crypto.randomUUID())
    apps.push(app)
    return app
  }

  afterEach(clearFirestore)
  afterAll(() => Promise.all(apps.map(deleteApp)))

  return {
    signUp: async () => {
      const app = newApp()
      const auth = getAuth(app)
      connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true })
      const { user } = await createUserWithEmailAndPassword(auth, `${crypto.randomUUID()}@example.com`, 'secret-123')
      return { clientId: user.uid, call: connect(app) }
    },
    anonymous: () => ({ call: connect(newApp()) }),
  }
}

export const inHours = (hours: number) => Date.now() + hours * HOUR_MS
export const minutesAgo = (minutes: number) => Timestamp.fromMillis(Date.now() - minutes * 60 * 1000)

export const seedConnection = async (clientId: string) => {
  const ref = db.collection(COLLECTIONS.connections).doc()
  await ref.set({ clientId, name: 'Loja Centro', createdAt: Timestamp.now(), updatedAt: Timestamp.now() })
  return ref.id
}

export const seedContact = async (clientId: string, connectionId: string) => {
  const ref = db.collection(COLLECTIONS.contacts).doc()
  await ref.set({
    clientId,
    connectionId,
    name: 'Ana',
    phone: '+5511999999999',
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  })
  return ref.id
}

export const seedMessage = async (clientId: string, overrides: Record<string, unknown> = {}) => {
  const ref = db.collection(COLLECTIONS.messages).doc()
  await ref.set({
    clientId,
    connectionId: 'connection-1',
    contactIds: ['contact-1'],
    recipients: {},
    body: 'Promoção de hoje',
    status: 'scheduled',
    scheduledAt: Timestamp.fromMillis(inHours(1)),
    sentAt: null,
    editedAt: null,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
    ...overrides,
  })
  return ref
}

export const revisionsOf = async (messageId: string) => {
  const revisions = await db.collection(COLLECTIONS.messageRevisions).where('messageId', '==', messageId).get()
  return revisions.docs.map((doc) => doc.data())
}
