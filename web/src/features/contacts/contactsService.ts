import {
  COLLECTIONS,
  type Contact,
  type ContactInput,
  type DeleteContactInput,
  type DeleteContactResult,
  type Message,
} from '@broadcast/shared'
import { addDoc, collection, doc, getDocs, query, serverTimestamp, updateDoc, where } from 'firebase/firestore'
import { httpsCallable } from 'firebase/functions'
import { useMemo } from 'react'
import { db, functions } from '../../lib/firebase'
import { useQueryData } from '../../lib/firestoreHooks'

const contacts = collection(db, COLLECTIONS.contacts)

export const createContact = (clientId: string, connectionId: string, { name, phone }: ContactInput) =>
  addDoc(contacts, { clientId, connectionId, name, phone, createdAt: serverTimestamp(), updatedAt: serverTimestamp() })

export const updateContact = (contactId: string, { name, phone }: ContactInput) =>
  updateDoc(doc(contacts, contactId), { name, phone, updatedAt: serverTimestamp() })

export const findScheduledMessagesWith = async (clientId: string, contactId: string) => {
  const snapshot = await getDocs(
    query(
      collection(db, COLLECTIONS.messages),
      where('clientId', '==', clientId),
      where('status', '==', 'scheduled'),
      where('contactIds', 'array-contains', contactId),
    ),
  )
  return snapshot.docs.map((item) => item.data() as Message)
}

const deleteContactCallable = httpsCallable<DeleteContactInput, DeleteContactResult>(functions, 'deleteContact')

export const deleteContact = async (contactId: string) => (await deleteContactCallable({ contactId })).data

const byName = new Intl.Collator('pt-BR', { sensitivity: 'base' })

export const useContacts = (clientId: string, connectionId: string) => {
  const contactsQuery = useMemo(
    () => query(contacts, where('clientId', '==', clientId), where('connectionId', '==', connectionId)),
    [clientId, connectionId],
  )
  const result = useQueryData<Contact>(contactsQuery)
  const sorted = useMemo(() => result.data.toSorted((a, b) => byName.compare(a.name, b.name)), [result.data])
  return { ...result, data: sorted }
}
