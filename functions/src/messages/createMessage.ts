import {
  COLLECTIONS,
  createMessageInputSchema,
  isInFuture,
  type CreateMessageResult,
  type RecipientStatus,
} from '@broadcast/shared'
import { FieldValue, getFirestore, Timestamp } from 'firebase-admin/firestore'
import { HttpsError, onCall } from 'firebase-functions/v2/https'
import { parseInput, requireClientId } from '../lib/callable.ts'

export const createMessage = onCall(async (request): Promise<CreateMessageResult> => {
  const clientId = requireClientId(request)
  const { connectionId, contactIds, body, scheduledAt } = parseInput(createMessageInputSchema, request.data)
  if (scheduledAt !== null && !isInFuture(scheduledAt, Date.now())) {
    throw new HttpsError('invalid-argument', 'Escolha uma data e hora no futuro.')
  }

  const db = getFirestore()
  const connectionRef = db.collection(COLLECTIONS.connections).doc(connectionId)
  const contactRefs = contactIds.map((contactId) => db.collection(COLLECTIONS.contacts).doc(contactId))
  const messageRef = db.collection(COLLECTIONS.messages).doc()

  await db.runTransaction(async (transaction) => {
    const [connection, ...contacts] = await transaction.getAll(connectionRef, ...contactRefs)
    if (!connection.exists || connection.get('clientId') !== clientId) {
      throw new HttpsError('not-found', 'Conexão não encontrada.')
    }
    const allFromConnection = contacts.every(
      (contact) =>
        contact.exists && contact.get('clientId') === clientId && contact.get('connectionId') === connectionId,
    )
    if (!allFromConnection) {
      throw new HttpsError('failed-precondition', 'Um dos contatos não existe mais. Atualize a seleção.')
    }

    const isScheduled = scheduledAt !== null
    const recipients: Record<string, RecipientStatus> = isScheduled
      ? {}
      : Object.fromEntries(contactIds.map((contactId) => [contactId, 'sent']))

    transaction.create(messageRef, {
      clientId,
      connectionId,
      contactIds,
      recipients,
      body,
      status: isScheduled ? 'scheduled' : 'sent',
      scheduledAt: isScheduled ? Timestamp.fromMillis(scheduledAt) : null,
      sentAt: isScheduled ? null : FieldValue.serverTimestamp(),
      editedAt: null,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    })
  })

  return { messageId: messageRef.id }
})
