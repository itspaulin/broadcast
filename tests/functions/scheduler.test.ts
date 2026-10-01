import { Timestamp } from 'firebase-admin/firestore'
import { describe, expect, it } from 'vitest'
import { findDueMessages, markAsSent, sendDueMessages } from '../../functions/src/messages/sendDueMessages.ts'
import { db, inHours, minutesAgo, seedMessage, setupFunctionsEnv } from './helpers.ts'

setupFunctionsEnv()

const CLIENT_ID = 'alice'

const seedDue = (overrides: Record<string, unknown> = {}) =>
  seedMessage(CLIENT_ID, { scheduledAt: minutesAgo(1), ...overrides })

describe('sendDueMessages', () => {
  it('sends due messages and leaves future ones scheduled', async () => {
    const due = await seedDue({ contactIds: ['contact-1', 'contact-2'] })
    const future = await seedMessage(CLIENT_ID)

    expect(await sendDueMessages(db)).toEqual({ sent: 1, skipped: 0 })

    const sent = (await due.get()).data()
    expect(sent).toMatchObject({ status: 'sent', recipients: { 'contact-1': 'sent', 'contact-2': 'sent' } })
    expect(sent?.sentAt).not.toBeNull()
    expect((await future.get()).data()).toMatchObject({ status: 'scheduled', sentAt: null, recipients: {} })
  })

  it('sends due messages of every client in one run', async () => {
    await seedDue()
    await seedMessage('bob', { scheduledAt: minutesAgo(1) })

    expect(await sendDueMessages(db)).toEqual({ sent: 2, skipped: 0 })
  })

  it('does not send again on a second run', async () => {
    const due = await seedDue()
    await sendDueMessages(db)
    const { sentAt } = (await due.get()).data() ?? {}

    expect(await sendDueMessages(db)).toEqual({ sent: 0, skipped: 0 })
    expect((await due.get()).get('sentAt')).toEqual(sentAt)
  })

  it('sends each message once when two runs overlap', async () => {
    await Promise.all([seedDue(), seedDue(), seedDue()])

    const runs = await Promise.all([sendDueMessages(db), sendDueMessages(db)])

    expect(runs[0].sent + runs[1].sent).toBe(3)
  })

  it('skips a message rescheduled after it was read', async () => {
    const due = await seedDue()
    const read = await findDueMessages(db)
    await due.update({ scheduledAt: Timestamp.fromMillis(inHours(1)) })

    expect(await markAsSent(read)).toEqual({ sent: 0, skipped: 1 })
    expect((await due.get()).data()).toMatchObject({ status: 'scheduled', sentAt: null })
  })

  it('skips a message deleted after it was read', async () => {
    const due = await seedDue()
    const read = await findDueMessages(db)
    await due.delete()

    expect(await markAsSent(read)).toEqual({ sent: 0, skipped: 1 })
    expect((await due.get()).exists).toBe(false)
  })
})
