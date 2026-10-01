import {
  COLLECTIONS,
  type Connection,
  type ConnectionInput,
  type DeleteConnectionInput,
  type DeleteConnectionResult,
} from '@broadcast/shared'
import {
  addDoc,
  collection,
  doc,
  getCountFromServer,
  query,
  serverTimestamp,
  updateDoc,
  where,
  type QueryConstraint,
} from 'firebase/firestore'
import { httpsCallable } from 'firebase/functions'
import { useMemo } from 'react'
import { db, functions } from '../../lib/firebase'
import { useQueryData } from '../../lib/firestoreHooks'

const connections = collection(db, COLLECTIONS.connections)

export const createConnection = (clientId: string, { name }: ConnectionInput) =>
  addDoc(connections, { clientId, name, createdAt: serverTimestamp(), updatedAt: serverTimestamp() })

export const renameConnection = (connectionId: string, { name }: ConnectionInput) =>
  updateDoc(doc(connections, connectionId), { name, updatedAt: serverTimestamp() })

const countWhere = async (collectionName: string, ...filters: QueryConstraint[]) => {
  const snapshot = await getCountFromServer(query(collection(db, collectionName), ...filters))
  return snapshot.data().count
}

export type ConnectionImpact = { contacts: number; messages: number; scheduled: number }

export const countConnectionData = async (clientId: string, connectionId: string): Promise<ConnectionImpact> => {
  const ofConnection = [where('clientId', '==', clientId), where('connectionId', '==', connectionId)]
  const [contacts, messages, scheduled] = await Promise.all([
    countWhere(COLLECTIONS.contacts, ...ofConnection),
    countWhere(COLLECTIONS.messages, ...ofConnection),
    countWhere(COLLECTIONS.messages, ...ofConnection, where('status', '==', 'scheduled')),
  ])
  return { contacts, messages, scheduled }
}

const deleteConnectionCallable = httpsCallable<DeleteConnectionInput, DeleteConnectionResult>(
  functions,
  'deleteConnection',
)

export const deleteConnection = async (connectionId: string) =>
  (await deleteConnectionCallable({ connectionId })).data

const byName = new Intl.Collator('pt-BR', { sensitivity: 'base' })

// Sorted on the client: the list is small, needs no composite index, and the collator
// orders accents and casing the way users expect (Firestore orders by code point).
export const useConnections = (clientId: string) => {
  const connectionsQuery = useMemo(() => query(connections, where('clientId', '==', clientId)), [clientId])
  const result = useQueryData<Connection>(connectionsQuery)
  const sorted = useMemo(() => result.data.toSorted((a, b) => byName.compare(a.name, b.name)), [result.data])
  return { ...result, data: sorted }
}
