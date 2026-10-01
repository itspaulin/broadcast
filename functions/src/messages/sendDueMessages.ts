import { COLLECTIONS } from '@broadcast/shared'
import { FieldValue, Timestamp, type Firestore, type QueryDocumentSnapshot } from 'firebase-admin/firestore'
import { sentRecipients } from '../lib/messages.ts'

const PAGE_SIZE = 500

export const findDueMessages = async (db: Firestore) => {
  const due = await db
    .collection(COLLECTIONS.messages)
    .where('status', '==', 'scheduled')
    .where('scheduledAt', '<=', Timestamp.now())
    .orderBy('scheduledAt')
    .limit(PAGE_SIZE)
    .get()
  return due.docs
}

// The precondition makes each write fail if the message changed after the query read it,
// so an edit, a deletion or an overlapping run is never overwritten.
export const markAsSent = async (messages: QueryDocumentSnapshot[]) => {
  const results = await Promise.allSettled(
    messages.map((message) =>
      message.ref.update(
        {
          status: 'sent',
          recipients: sentRecipients(message.get('contactIds')),
          sentAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        },
        { lastUpdateTime: message.updateTime },
      ),
    ),
  )
  const sent = results.filter((result) => result.status === 'fulfilled').length

  return { sent, skipped: messages.length - sent }
}

// Stops on a page with no successful write: the same messages would come back forever.
export const sendDueMessages = async (db: Firestore) => {
  const totals = { sent: 0, skipped: 0 }
  let found: number
  let sent: number

  do {
    const messages = await findDueMessages(db)
    const page = await markAsSent(messages)
    found = messages.length
    sent = page.sent
    totals.sent += page.sent
    totals.skipped += page.skipped
  } while (found === PAGE_SIZE && sent > 0)

  return totals
}
