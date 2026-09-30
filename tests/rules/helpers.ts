import { readFileSync } from 'node:fs'
import { initializeTestEnvironment, type RulesTestEnvironment } from '@firebase/rules-unit-testing'
import { doc, setDoc, Timestamp } from 'firebase/firestore'
import { afterAll, afterEach, beforeAll } from 'vitest'

export const ALICE = 'alice'
export const BOB = 'bob'

const rules = readFileSync(new URL('../../firestore.rules', import.meta.url), 'utf8')

export const setupRulesEnv = () => {
  const state = {} as { env: RulesTestEnvironment }

  beforeAll(async () => {
    state.env = await initializeTestEnvironment({
      projectId: 'demo-broadcast-rules',
      firestore: { rules },
    })
  })
  afterEach(() => state.env.clearFirestore())
  afterAll(() => state.env.cleanup())

  return {
    as: (uid: string) => state.env.authenticatedContext(uid).firestore(),
    anonymous: () => state.env.unauthenticatedContext().firestore(),
    seed: (path: string, data: Record<string, unknown>) =>
      state.env.withSecurityRulesDisabled((context) => setDoc(doc(context.firestore(), path), data)),
  }
}

const now = Timestamp.now()

export const connectionData = (clientId: string) => ({
  clientId,
  name: 'Loja Centro',
  createdAt: now,
  updatedAt: now,
})

export const contactData = (clientId: string, connectionId: string) => ({
  clientId,
  connectionId,
  name: 'Ana',
  phone: '+5511999999999',
  createdAt: now,
  updatedAt: now,
})

export const messageData = (clientId: string, connectionId: string) => ({
  clientId,
  connectionId,
  contactIds: ['contact-1'],
  recipients: {},
  body: 'Promoção de hoje',
  status: 'scheduled',
  scheduledAt: Timestamp.fromMillis(now.toMillis() + 60 * 60 * 1000),
  sentAt: null,
  editedAt: null,
  createdAt: now,
  updatedAt: now,
})
