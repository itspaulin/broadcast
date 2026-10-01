import { readFileSync } from 'node:fs'
import { initializeApp } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import { sendDueMessages } from '../src/messages/sendDueMessages.ts'

// The Functions emulator never fires onSchedule, so local development runs the same logic on a timer.
const INTERVAL_MS = 60 * 1000

// Set unconditionally: this script must never reach the real project.
process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8080'

const firebaserc = JSON.parse(readFileSync(new URL('../../.firebaserc', import.meta.url), 'utf8'))
initializeApp({ projectId: firebaserc.projects.default })
const db = getFirestore()

const run = () =>
  sendDueMessages(db)
    .then((totals) => {
      if (totals.sent > 0 || totals.skipped > 0) console.log('Scheduled messages processed', totals)
    })
    .catch((error: Error) => console.error('Scheduler run failed:', error.message))

setInterval(run, INTERVAL_MS)
