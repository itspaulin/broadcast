import { COLLECTIONS, deleteContactInputSchema, type DeleteContactResult } from '@broadcast/shared'
import { FieldValue, getFirestore } from 'firebase-admin/firestore'
import { HttpsError, onCall } from 'firebase-functions/v2/https'
import { parseInput, requireClientId } from '../lib/callable.ts'
import { chunk, IN_FILTER_LIMIT } from '../lib/firestore.ts'

// One transaction so the scheduler cannot send a message while the contact is being
// removed from it. Sent messages keep the id as history.
export const deleteContact = onCall(async (request): Promise<DeleteContactResult> => {
  const clientId = requireClientId(request)
  const { contactId } = parseInput(deleteContactInputSchema, request.data)
  const db = getFirestore()
  const contactRef = db.collection(COLLECTIONS.contacts).doc(contactId)

  return db.runTransaction(async (transaction) => {
    const contact = await transaction.get(contactRef)
    if (!contact.exists || contact.get('clientId') !== clientId) {
      throw new HttpsError('not-found', 'Contato não encontrado.')
    }

    const scheduled = await transaction.get(
      db
        .collection(COLLECTIONS.messages)
        .where('clientId', '==', clientId)
        .where('status', '==', 'scheduled')
        .where('contactIds', 'array-contains', contactId),
    )
    const emptied = scheduled.docs.filter((doc) => doc.get('contactIds').length === 1)
    const remaining = scheduled.docs.filter((doc) => doc.get('contactIds').length > 1)

    const revisions = await Promise.all(
      chunk(
        emptied.map((doc) => doc.id),
        IN_FILTER_LIMIT,
      ).map((ids) =>
        transaction.get(
          db
            .collection(COLLECTIONS.messageRevisions)
            .where('clientId', '==', clientId)
            .where('messageId', 'in', ids),
        ),
      ),
    )

    remaining.forEach((doc) =>
      transaction.update(doc.ref, {
        contactIds: FieldValue.arrayRemove(contactId),
        [`recipients.${contactId}`]: FieldValue.delete(),
        updatedAt: FieldValue.serverTimestamp(),
      }),
    )
    revisions.flatMap((snapshot) => snapshot.docs).forEach((doc) => transaction.delete(doc.ref))
    emptied.forEach((doc) => transaction.delete(doc.ref))
    transaction.delete(contactRef)

    return { updatedMessages: remaining.length, deletedMessages: emptied.length }
  })
})
