import { recipientStatusAt, recipientStatusTime, recipientTimeline } from '@broadcast/shared'
import { describe, expect, it } from 'vitest'
import { countStatuses, recipientRows } from '../../web/src/features/messages/delivery.ts'
import { at, contact, message, MINUTE_MS } from './helpers.ts'

const SENT_AT = Date.UTC(2026, 9, 1, 12, 0)
const SECOND_MS = 1000
const timelines = Array.from({ length: 1000 }, (_, index) => recipientTimeline('message-1', `contact-${index}`, SENT_AT))

describe('recipientTimeline', () => {
  it('gives the same timeline for the same message and contact', () => {
    expect(recipientTimeline('message-1', 'contact-1', SENT_AT)).toEqual(
      recipientTimeline('message-1', 'contact-1', SENT_AT),
    )
  })

  it('differs between contacts and between messages', () => {
    const base = recipientTimeline('message-1', 'contact-1', SENT_AT)
    expect(recipientTimeline('message-1', 'contact-2', SENT_AT).deliveredAt).not.toBe(base.deliveredAt)
    expect(recipientTimeline('message-2', 'contact-1', SENT_AT).deliveredAt).not.toBe(base.deliveredAt)
  })

  it('delivers between 5 and 60 seconds after sending', () => {
    for (const { deliveredAt } of timelines) {
      expect(deliveredAt - SENT_AT).toBeGreaterThanOrEqual(5 * SECOND_MS)
      expect(deliveredAt - SENT_AT).toBeLessThan(60 * SECOND_MS)
    }
  })

  it('reads between 1 and 10 minutes after delivery, for about 80% of the recipients', () => {
    const read = timelines.filter((timeline) => timeline.readAt !== null)
    for (const { deliveredAt, readAt } of read) {
      expect(readAt! - deliveredAt).toBeGreaterThanOrEqual(MINUTE_MS)
      expect(readAt! - deliveredAt).toBeLessThan(10 * MINUTE_MS)
    }
    expect(read.length).toBeGreaterThan(750)
    expect(read.length).toBeLessThan(850)
  })
})

describe('recipientStatusAt', () => {
  const timeline = { sentAt: SENT_AT, deliveredAt: SENT_AT + 10 * SECOND_MS, readAt: SENT_AT + 2 * MINUTE_MS }

  it('moves from sent to delivered to read as time passes', () => {
    expect(recipientStatusAt(timeline, SENT_AT)).toBe('sent')
    expect(recipientStatusAt(timeline, timeline.deliveredAt)).toBe('delivered')
    expect(recipientStatusAt(timeline, timeline.readAt)).toBe('read')
  })

  it('stays at delivered when the recipient never reads', () => {
    expect(recipientStatusAt({ ...timeline, readAt: null }, SENT_AT + 60 * MINUTE_MS)).toBe('delivered')
  })

  it('reports when each status was reached', () => {
    expect(recipientStatusTime(timeline, 'sent')).toBe(SENT_AT)
    expect(recipientStatusTime(timeline, 'delivered')).toBe(timeline.deliveredAt)
    expect(recipientStatusTime(timeline, 'read')).toBe(timeline.readAt)
  })
})

describe('recipientRows', () => {
  const contacts = [contact('a', 'Ana'), contact('b', 'Bruno'), contact('c', 'Carla')]
  const sent = message('message-1', { status: 'sent', sentAt: at(SENT_AT), contactIds: ['gone', 'c', 'a'] })

  it('lists recipients in contact order, with deleted contacts last', () => {
    const rows = recipientRows(sent, contacts, SENT_AT)
    expect(rows.map((row) => row.contact?.name ?? null)).toEqual(['Ana', 'Carla', null])
    expect(rows.map((row) => row.contactId)).toEqual(['a', 'c', 'gone'])
  })

  it('counts every recipient in exactly one status', () => {
    expect(countStatuses(recipientRows(sent, contacts, SENT_AT))).toEqual({ read: 0, delivered: 0, sent: 3 })

    const later = countStatuses(recipientRows(sent, contacts, SENT_AT + 60 * MINUTE_MS))
    expect(later.sent).toBe(0)
    expect(later.read + later.delivered).toBe(3)
  })
})
