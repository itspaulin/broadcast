import { COLLECTIONS, deleteMessageInputSchema } from '@broadcast/shared'
import { getFirestore } from 'firebase-admin/firestore'
import { HttpsError, onCall } from 'firebase-functions/v2/https'
import { parseInput, requireClientId } from '../lib/callable.ts'

export const deleteMessage = onCall(async (request): Promise<void> => {
  const clientId = requireClientId(request)
  const { messageId } = parseInput(deleteMessageInputSchema, request.data)

  const db = getFirestore()
  const messageRef = db.collection(COLLECTIONS.messages).doc(messageId)

  await db.runTransaction(async (transaction) => {
    const message = await transaction.get(messageRef)
    if (!message.exists || message.get('clientId') !== clientId) {
      throw new HttpsError('not-found', 'Mensagem não encontrada.')
    }

    const revisions = await transaction.get(
      db
        .collection(COLLECTIONS.messageRevisions)
        .where('clientId', '==', clientId)
        .where('messageId', '==', messageId),
    )

    revisions.docs.forEach((doc) => transaction.delete(doc.ref))
    transaction.delete(messageRef)
  })
})
