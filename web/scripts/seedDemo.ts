import {
  COLLECTIONS,
  contactInputSchema,
  FUNCTIONS_REGION,
  type CreateMessageInput,
  type CreateMessageResult,
} from '@broadcast/shared'
import { FirebaseError, initializeApp } from 'firebase/app'
import {
  connectAuthEmulator,
  createUserWithEmailAndPassword,
  getAuth,
  signInWithEmailAndPassword,
  type Auth,
} from 'firebase/auth'
import {
  addDoc,
  collection,
  connectFirestoreEmulator,
  doc,
  getDocs,
  getFirestore,
  limit,
  query,
  serverTimestamp,
  setDoc,
  where,
} from 'firebase/firestore'
import { connectFunctionsEmulator, getFunctions, httpsCallable } from 'firebase/functions'

// Creates the demo accounts the same way a user would: sign-up, then connections and contacts
// through the Security Rules, then messages through the callables. No admin credentials needed.
// Runs against the emulators unless called with --production.

const HOUR_MS = 60 * 60 * 1000
const PASSWORD = 'demo123'

type DemoMessage = { body: string; to: 'all' | number; inHours?: number }
type DemoConnection = { name: string; contacts: [name: string, phone: string][]; messages: DemoMessage[] }
type DemoClient = { name: string; email: string; connections: DemoConnection[] }

const CLIENTS: DemoClient[] = [
  {
    name: 'Padaria Pão Quente',
    email: 'demo@broadcast.dev',
    connections: [
      {
        name: 'Loja Centro',
        contacts: [
          ['Ana Souza', '(11) 98765-4321'],
          ['Bruno Lima', '(11) 97654-3210'],
          ['Carla Mendes', '(11) 3322-4455'],
          ['Diego Rocha', '(21) 99887-7665'],
          ['Eduarda Barbosa', '(11) 99897-2903'],
          ['Felipe Nunes', '(11) 95096-3112'],
          ['Gabriela Martins', '(11) 97635-2261'],
          ['Henrique Dias', '(19) 93738-1334'],
        ],
        messages: [
          { body: 'Bom dia! Pão de queijo saindo do forno agora. Encomendas pelo balcão até as 11h.', to: 'all' },
          { body: 'Hoje fechamos às 18h por causa do feriado.\nAmanhã voltamos ao horário normal.', to: 5 },
          { body: 'Promoção de sexta: na compra de 10 pães franceses, ganhe 1 sonho.', to: 'all', inHours: 2.25 },
          {
            body: 'Lembrete: sua encomenda de bolo de aniversário fica pronta amanhã às 9h. Qualquer dúvida, é só responder.',
            to: 3,
            inHours: 20,
          },
        ],
      },
      {
        name: 'Loja Zona Sul',
        contacts: [
          ['Isabela Alves', '(11) 91234-5678'],
          ['João Costa', '(11) 92345-6789'],
          ['Larissa Gomes', '(11) 98741-6307'],
        ],
        messages: [{ body: 'Inauguramos o café da tarde: de segunda a sexta, das 15h às 18h.', to: 'all', inHours: 48 }],
      },
      { name: 'Delivery', contacts: [], messages: [] },
    ],
  },
  {
    name: 'Studio Fit',
    email: 'demo2@broadcast.dev',
    connections: [
      {
        name: 'Unidade Jardins',
        contacts: [
          ['Marina Ferreira', '(11) 93361-8727'],
          ['Otávio Ribeiro', '(11) 96981-2147'],
          ['Paula Teixeira', '(11) 95221-6987'],
        ],
        messages: [
          { body: 'A aula de funcional de hoje começa às 19h, na sala 2.', to: 'all' },
          { body: 'Sua avaliação física está agendada para amanhã. Chegue 10 minutos antes.', to: 1, inHours: 18 },
        ],
      },
    ],
  },
]

process.loadEnvFile(new URL('../.env', import.meta.url))
const production = process.argv.includes('--production')

const signInOrSignUp = async (auth: Auth, email: string) => {
  try {
    return (await signInWithEmailAndPassword(auth, email, PASSWORD)).user
  } catch (error) {
    const unknownUser =
      error instanceof FirebaseError && ['auth/invalid-credential', 'auth/user-not-found'].includes(error.code)
    if (!unknownUser) throw error
    return (await createUserWithEmailAndPassword(auth, email, PASSWORD)).user
  }
}

const seedClient = async (client: DemoClient) => {
  const app = initializeApp(
    { apiKey: process.env.VITE_FIREBASE_API_KEY, projectId: process.env.VITE_FIREBASE_PROJECT_ID },
    client.email,
  )
  const auth = getAuth(app)
  const db = getFirestore(app)
  const functions = getFunctions(app, FUNCTIONS_REGION)
  if (!production) {
    connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true })
    connectFirestoreEmulator(db, '127.0.0.1', 8080)
    connectFunctionsEmulator(functions, '127.0.0.1', 5001)
  }
  const createMessage = httpsCallable<CreateMessageInput, CreateMessageResult>(functions, 'createMessage')

  const user = await signInOrSignUp(auth, client.email)
  const clientId = user.uid
  await setDoc(doc(db, COLLECTIONS.clients, clientId), { name: client.name }, { merge: true })

  // An account that already has data is left alone, so running the seed twice does not duplicate it.
  const existing = await getDocs(
    query(collection(db, COLLECTIONS.connections), where('clientId', '==', clientId), limit(1)),
  )
  if (!existing.empty) {
    console.log(`${client.email}: já tem dados, nada a fazer`)
    return
  }

  const owned = { clientId, createdAt: serverTimestamp(), updatedAt: serverTimestamp() }
  for (const connection of client.connections) {
    const connectionRef = await addDoc(collection(db, COLLECTIONS.connections), { ...owned, name: connection.name })
    const contactIds: string[] = []
    for (const [name, phone] of connection.contacts) {
      const contact = contactInputSchema.parse({ name, phone })
      const contactRef = await addDoc(collection(db, COLLECTIONS.contacts), {
        ...owned,
        ...contact,
        connectionId: connectionRef.id,
      })
      contactIds.push(contactRef.id)
    }
    for (const message of connection.messages) {
      await createMessage({
        connectionId: connectionRef.id,
        contactIds: message.to === 'all' ? contactIds : contactIds.slice(0, message.to),
        body: message.body,
        scheduledAt: message.inHours ? Date.now() + message.inHours * HOUR_MS : null,
      })
    }
  }
  console.log(`${client.email}: dados criados`)
}

console.log(`Destino: ${production ? `projeto ${process.env.VITE_FIREBASE_PROJECT_ID}` : 'emuladores'}`)
for (const client of CLIENTS) await seedClient(client)
// The Firestore SDK keeps its connection open; nothing is left to do.
process.exit(0)
