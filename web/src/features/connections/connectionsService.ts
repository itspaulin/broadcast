import { COLLECTIONS, type Connection, type ConnectionInput } from '@broadcast/shared'
import { addDoc, collection, doc, query, serverTimestamp, updateDoc, where } from 'firebase/firestore'
import { useMemo } from 'react'
import { db } from '../../lib/firebase'
import { useQueryData } from '../../lib/firestoreHooks'

const connections = collection(db, COLLECTIONS.connections)

export const createConnection = (clientId: string, { name }: ConnectionInput) =>
  addDoc(connections, { clientId, name, createdAt: serverTimestamp(), updatedAt: serverTimestamp() })

export const renameConnection = (connectionId: string, { name }: ConnectionInput) =>
  updateDoc(doc(connections, connectionId), { name, updatedAt: serverTimestamp() })

const byName = new Intl.Collator('pt-BR', { sensitivity: 'base' })

// Sorted on the client: the list is small, needs no composite index, and the collator
// orders accents and casing the way users expect (Firestore orders by code point).
export const useConnections = (clientId: string) => {
  const connectionsQuery = useMemo(() => query(connections, where('clientId', '==', clientId)), [clientId])
  const result = useQueryData<Connection>(connectionsQuery)
  const sorted = useMemo(() => result.data.toSorted((a, b) => byName.compare(a.name, b.name)), [result.data])
  return { ...result, data: sorted }
}
