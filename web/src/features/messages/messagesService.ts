import {
  COLLECTIONS,
  type CreateMessageInput,
  type CreateMessageResult,
  type DeleteMessageInput,
  type Message,
  type UpdateMessageInput,
} from '@broadcast/shared'
import { collection, query, where } from 'firebase/firestore'
import { httpsCallable } from 'firebase/functions'
import { useMemo } from 'react'
import { db, functions } from '../../lib/firebase'
import { useQueryData } from '../../lib/firestoreHooks'
import { sortMessages } from './messages'

const messages = collection(db, COLLECTIONS.messages)

const createMessageCallable = httpsCallable<CreateMessageInput, CreateMessageResult>(functions, 'createMessage')

export const createMessage = async (input: CreateMessageInput) => (await createMessageCallable(input)).data

const updateMessageCallable = httpsCallable<UpdateMessageInput, void>(functions, 'updateMessage')

export const updateMessage = async (input: UpdateMessageInput) => {
  await updateMessageCallable(input)
}

const deleteMessageCallable = httpsCallable<DeleteMessageInput, void>(functions, 'deleteMessage')

export const deleteMessage = async (messageId: string) => {
  await deleteMessageCallable({ messageId })
}

export const useMessages = (clientId: string, connectionId: string) => {
  const messagesQuery = useMemo(
    () => query(messages, where('clientId', '==', clientId), where('connectionId', '==', connectionId)),
    [clientId, connectionId],
  )
  const result = useQueryData<Message>(messagesQuery)
  const sorted = useMemo(() => sortMessages(result.data), [result.data])
  return { ...result, data: sorted }
}
