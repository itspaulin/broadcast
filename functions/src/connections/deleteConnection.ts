import { COLLECTIONS, deleteConnectionInputSchema, type DeleteConnectionResult } from '@broadcast/shared'
import { getFirestore, type Firestore } from 'firebase-admin/firestore'
import { HttpsError, onCall } from 'firebase-functions/v2/https'
import { parseInput, requireClientId } from '../lib/callable.ts'
import { chunk, deleteInBatches, IN_FILTER_LIMIT } from '../lib/firestore.ts'

const findRevisionRefs = async (db: Firestore, clientId: string, messageIds: string[]) => {
  const snapshots = await Promise.all(
    chunk(messageIds, IN_FILTER_LIMIT).map((ids) =>
      db
        .collection(COLLECTIONS.messageRevisions)
        .where('clientId', '==', clientId)
        .where('messageId', 'in', ids)
        .select()
        .get(),
    ),
  )
  return snapshots.flatMap((snapshot) => snapshot.docs.map((doc) => doc.ref))
}

// Children go first and the connection last, so a run that fails halfway can simply be retried.
export const deleteConnection = onCall(async (request): Promise<DeleteConnectionResult> => {
  const clientId = requireClientId(request)
  const { connectionId } = parseInput(deleteConnectionInputSchema, request.data)
  const db = getFirestore()

  const connectionRef = db.collection(COLLECTIONS.connections).doc(connectionId)
  const connection = await connectionRef.get()
  if (!connection.exists || connection.get('clientId') !== clientId) {
    throw new HttpsError('not-found', 'Conexão não encontrada.')
  }

  const ofConnection = (collection: string) =>
    db.collection(collection).where('clientId', '==', clientId).where('connectionId', '==', connectionId).select().get()

  const [contacts, messages] = await Promise.all([
    ofConnection(COLLECTIONS.contacts),
    ofConnection(COLLECTIONS.messages),
  ])
  const revisionRefs = await findRevisionRefs(
    db,
    clientId,
    messages.docs.map((doc) => doc.id),
  )

  await deleteInBatches(db, [
    ...revisionRefs,
    ...messages.docs.map((doc) => doc.ref),
    ...contacts.docs.map((doc) => doc.ref),
  ])
  await connectionRef.delete()

  return { contacts: contacts.size, messages: messages.size }
})
