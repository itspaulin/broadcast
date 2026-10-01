import type { RecipientStatus } from './types.ts'

// Sending is simulated, so nothing ever reports a delivery or a read. Each recipient's progress
// is derived from the send time and a hash of the message and contact ids: every device computes
// the same timeline, and no write is needed to move a status forward.

const SECOND_MS = 1000
const MINUTE_MS = 60 * SECOND_MS

const DELIVERY_DELAY_MS = { min: 5 * SECOND_MS, max: 60 * SECOND_MS }
const READ_DELAY_MS = { min: 1 * MINUTE_MS, max: 10 * MINUTE_MS }
// Share of recipients that eventually read the message; the rest stay at "delivered".
const READ_RATE = 0.8

// FNV-1a: a small, stable string hash. The same text always gives the same number.
const hash = (text: string) => {
  let value = 0x811c9dc5
  for (let index = 0; index < text.length; index += 1) {
    value ^= text.charCodeAt(index)
    value = Math.imul(value, 0x01000193)
  }
  return value >>> 0
}

// A number in [0, 1) that depends only on the seed.
const fraction = (seed: string) => hash(seed) / 2 ** 32

const between = ({ min, max }: { min: number; max: number }, seed: string) => min + fraction(seed) * (max - min)

export type RecipientTimeline = {
  sentAt: number
  deliveredAt: number
  // Null when this recipient never reads the message.
  readAt: number | null
}

export const recipientTimeline = (messageId: string, contactId: string, sentAt: number): RecipientTimeline => {
  const seed = `${messageId}:${contactId}`
  const deliveredAt = sentAt + between(DELIVERY_DELAY_MS, `${seed}:delivered`)
  const reads = fraction(`${seed}:reads`) < READ_RATE
  return { sentAt, deliveredAt, readAt: reads ? deliveredAt + between(READ_DELAY_MS, `${seed}:read`) : null }
}

export const recipientStatusAt = (timeline: RecipientTimeline, nowMillis: number): RecipientStatus => {
  if (timeline.readAt !== null && nowMillis >= timeline.readAt) return 'read'
  return nowMillis >= timeline.deliveredAt ? 'delivered' : 'sent'
}

// When the recipient reached the given status.
export const recipientStatusTime = (timeline: RecipientTimeline, status: RecipientStatus) =>
  status === 'read' && timeline.readAt !== null
    ? timeline.readAt
    : status === 'delivered'
      ? timeline.deliveredAt
      : timeline.sentAt
