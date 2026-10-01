import { COLLECTIONS, createMessageInputSchema, type CreateMessageResult } from '@broadcast/shared'
import { FieldValue, getFirestore, Timestamp } from 'firebase-admin/firestore'
import { HttpsError, onCall } from 'firebase-functions/v2/https'
import { parseInput, requireClientId } from '../lib/callable.ts'
import { assertContactsOfConnection, assertInFuture, sentRecipients } from '../lib/messages.ts'

export const createMessage = onCall(async (request): Promise<CreateMessageResult> => {
  const clientId = requireClientId(request)
  const { connectionId, contactIds, body, scheduledAt } = parseInput(createMessageInputSchema, request.data)
  if (scheduledAt !== null) assertInFuture(scheduledAt)

  const db = getFirestore()
  const connectionRef = db.collection(COLLECTIONS.connections).doc(connectionId)
  const contactRefs = contactIds.map((contactId) => db.collection(COLLECTIONS.contacts).doc(contactId))
  const messageRef = db.collection(COLLECTIONS.messages).doc()

  await db.runTransaction(async (transaction) => {
    const [connection, ...contacts] = await transaction.getAll(connectionRef, ...contactRefs)
    if (!connection.exists || connection.get('clientId') !== clientId) {
      throw new HttpsError('not-found', 'Conexão não encontrada.')
    }
    assertContactsOfConnection(contacts, clientId, connectionId)

    const isScheduled = scheduledAt !== null

    transaction.create(messageRef, {
      clientId,
      connectionId,
      contactIds,
      recipients: isScheduled ? {} : sentRecipients(contactIds),
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
