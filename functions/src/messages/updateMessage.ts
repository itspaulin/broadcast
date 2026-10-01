import { canEditMessage, COLLECTIONS, updateMessageInputSchema, type Message } from '@broadcast/shared'
import { FieldValue, getFirestore, Timestamp } from 'firebase-admin/firestore'
import { HttpsError, onCall } from 'firebase-functions/v2/https'
import { parseInput, requireClientId } from '../lib/callable.ts'
import { assertContactsOfConnection, assertInFuture } from '../lib/messages.ts'

export const updateMessage = onCall(async (request): Promise<void> => {
  const clientId = requireClientId(request)
  const { messageId, body, contactIds, scheduledAt } = parseInput(updateMessageInputSchema, request.data)

  const db = getFirestore()
  const messageRef = db.collection(COLLECTIONS.messages).doc(messageId)
  const revisionRef = db.collection(COLLECTIONS.messageRevisions).doc()

  await db.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(messageRef)
    if (!snapshot.exists || snapshot.get('clientId') !== clientId) {
      throw new HttpsError('not-found', 'Mensagem não encontrada.')
    }
    const message = snapshot.data() as Message
    const isSent = message.status === 'sent'

    if (isSent) {
      if (!canEditMessage(message, Date.now())) {
        throw new HttpsError('failed-precondition', 'O prazo para editar esta mensagem terminou.')
      }
      if (contactIds !== undefined || scheduledAt !== undefined) {
        throw new HttpsError('invalid-argument', 'Em mensagens enviadas só o texto pode ser editado.')
      }
    } else {
      if (scheduledAt === null) {
        throw new HttpsError('invalid-argument', 'Escolha uma data e hora no futuro.')
      }
      if (scheduledAt !== undefined) assertInFuture(scheduledAt)
      if (contactIds !== undefined) {
        const contacts = await transaction.getAll(
          ...contactIds.map((contactId) => db.collection(COLLECTIONS.contacts).doc(contactId)),
        )
        assertContactsOfConnection(contacts, clientId, message.connectionId)
      }
    }

    transaction.create(revisionRef, {
      clientId,
      messageId,
      body: message.body,
      contactIds: message.contactIds,
      scheduledAt: message.scheduledAt,
      createdAt: FieldValue.serverTimestamp(),
    })
    transaction.update(messageRef, {
      body,
      ...(contactIds !== undefined && { contactIds }),
      ...(scheduledAt != null && { scheduledAt: Timestamp.fromMillis(scheduledAt) }),
      ...(isSent && { editedAt: FieldValue.serverTimestamp() }),
      updatedAt: FieldValue.serverTimestamp(),
    })
  })
})
