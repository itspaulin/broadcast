import { COLLECTIONS } from '@broadcast/shared'
import { FieldValue, getFirestore, Timestamp, type Firestore } from 'firebase-admin/firestore'
import { logger } from 'firebase-functions/v2'
import { onSchedule } from 'firebase-functions/v2/scheduler'
import { sentRecipients } from '../lib/messages.ts'

const PAGE_SIZE = 500

// The precondition makes each write fail if the message changed after the query read it,
// so an edit, a deletion or an overlapping run is never overwritten.
const sendPage = async (db: Firestore) => {
  const due = await db
    .collection(COLLECTIONS.messages)
    .where('status', '==', 'scheduled')
    .where('scheduledAt', '<=', Timestamp.now())
    .orderBy('scheduledAt')
    .limit(PAGE_SIZE)
    .get()

  const results = await Promise.allSettled(
    due.docs.map((doc) =>
      doc.ref.update(
        {
          status: 'sent',
          recipients: sentRecipients(doc.get('contactIds')),
          sentAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        },
        { lastUpdateTime: doc.updateTime },
      ),
    ),
  )
  const sent = results.filter((result) => result.status === 'fulfilled').length

  return { found: due.size, sent, skipped: due.size - sent }
}

// Stops on a page with no successful write: the same messages would come back forever.
export const sendDueMessages = async (db: Firestore) => {
  const totals = { sent: 0, skipped: 0 }
  let page: Awaited<ReturnType<typeof sendPage>>

  do {
    page = await sendPage(db)
    totals.sent += page.sent
    totals.skipped += page.skipped
  } while (page.found === PAGE_SIZE && page.sent > 0)

  return totals
}

export const sendScheduledMessages = onSchedule('every 1 minutes', async () => {
  const totals = await sendDueMessages(getFirestore())
  if (totals.sent > 0 || totals.skipped > 0) logger.info('Scheduled messages processed', totals)
})
