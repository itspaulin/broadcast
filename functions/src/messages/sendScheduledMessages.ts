import { getFirestore } from 'firebase-admin/firestore'
import { logger } from 'firebase-functions/v2'
import { onSchedule } from 'firebase-functions/v2/scheduler'
import { sendDueMessages } from './sendDueMessages.ts'

export const sendScheduledMessages = onSchedule('every 1 minutes', async () => {
  const totals = await sendDueMessages(getFirestore())
  if (totals.sent > 0 || totals.skipped > 0) logger.info('Scheduled messages processed', totals)
})
