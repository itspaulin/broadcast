import { COLLECTIONS, type Message } from '@broadcast/shared'
import { collection, query, where } from 'firebase/firestore'
import { useMemo } from 'react'
import { db } from '../../lib/firebase'
import { useQueryData } from '../../lib/firestoreHooks'
import { sortMessages } from './messages'

const messages = collection(db, COLLECTIONS.messages)

export const useMessages = (clientId: string, connectionId: string) => {
  const messagesQuery = useMemo(
    () => query(messages, where('clientId', '==', clientId), where('connectionId', '==', connectionId)),
    [clientId, connectionId],
  )
  const result = useQueryData<Message>(messagesQuery)
  const sorted = useMemo(() => sortMessages(result.data), [result.data])
  return { ...result, data: sorted }
}
