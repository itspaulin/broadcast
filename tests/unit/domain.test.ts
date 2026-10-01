import {
  canEditMessage,
  contactInputSchema,
  createMessageInputSchema,
  EDIT_WINDOW_MS,
  editMinutesLeft,
  isDue,
  localDateTimeToMillis,
  MESSAGE_RECIPIENTS_MAX,
  messageFormSchema,
} from '@broadcast/shared'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { at, MINUTE_MS } from './helpers.ts'

const NOW = Date.UTC(2026, 9, 1, 12, 0)

describe('edit window', () => {
  it('always allows editing a scheduled message', () => {
    expect(canEditMessage({ status: 'scheduled', sentAt: null }, NOW)).toBe(true)
  })

  it('allows editing a sent message until 15 minutes after it was sent', () => {
    const sent = (minutesAgo: number) => ({ status: 'sent' as const, sentAt: at(NOW - minutesAgo * MINUTE_MS) })

    expect(canEditMessage(sent(0), NOW)).toBe(true)
    expect(canEditMessage(sent(14.9), NOW)).toBe(true)
    expect(canEditMessage(sent(15), NOW)).toBe(false)
    expect(canEditMessage(sent(60), NOW)).toBe(false)
  })

  it('counts the minutes left, rounded up, and never below zero', () => {
    expect(editMinutesLeft({ sentAt: at(NOW) }, NOW)).toBe(15)
    expect(editMinutesLeft({ sentAt: at(NOW - 9.5 * MINUTE_MS) }, NOW)).toBe(6)
    expect(editMinutesLeft({ sentAt: at(NOW - EDIT_WINDOW_MS + 1) }, NOW)).toBe(1)
    expect(editMinutesLeft({ sentAt: at(NOW - 20 * MINUTE_MS) }, NOW)).toBe(0)
    expect(editMinutesLeft({ sentAt: null }, NOW)).toBe(0)
  })
})

describe('isDue', () => {
  it('is true only for scheduled messages whose time has come', () => {
    expect(isDue({ status: 'scheduled', scheduledAt: at(NOW - 1) }, NOW)).toBe(true)
    expect(isDue({ status: 'scheduled', scheduledAt: at(NOW) }, NOW)).toBe(true)
    expect(isDue({ status: 'scheduled', scheduledAt: at(NOW + 1) }, NOW)).toBe(false)
    expect(isDue({ status: 'sent', scheduledAt: at(NOW - 1) }, NOW)).toBe(false)
  })
})

describe('localDateTimeToMillis', () => {
  it('reads the date and time in the local time zone', () => {
    expect(localDateTimeToMillis('2026-10-02', '14:30')).toBe(new Date(2026, 9, 2, 14, 30).getTime())
  })

  it('is NaN while a field is empty', () => {
    expect(localDateTimeToMillis('', '14:30')).toBeNaN()
    expect(localDateTimeToMillis('2026-10-02', '')).toBeNaN()
  })
})

describe('contact schema', () => {
  const phoneOf = (phone: string) => contactInputSchema.parse({ name: 'Ana', phone }).phone

  it('stores Brazilian phones as E.164 whatever the mask', () => {
    expect(phoneOf('(11) 98765-4321')).toBe('+5511987654321')
    expect(phoneOf('1133224455')).toBe('+551133224455')
    expect(phoneOf('+55 11 98765-4321')).toBe('+5511987654321')
  })

  it('explains a number without area code', () => {
    const result = contactInputSchema.safeParse({ name: 'Ana', phone: '98765-4321' })
    expect(result.error?.issues[0]?.message).toContain('Falta o DDD')
  })
})

describe('message schemas', () => {
  const input = { connectionId: 'connection-1', body: 'Oi', scheduledAt: null }

  it('removes repeated recipients and trims the text', () => {
    const parsed = createMessageInputSchema.parse({ ...input, body: '  Oi  ', contactIds: ['a', 'b', 'a'] })
    expect(parsed).toMatchObject({ body: 'Oi', contactIds: ['a', 'b'] })
  })

  it('rejects no recipients, too many recipients and an empty text', () => {
    const tooMany = Array.from({ length: MESSAGE_RECIPIENTS_MAX + 1 }, (_, index) => `contact-${index}`)

    expect(createMessageInputSchema.safeParse({ ...input, contactIds: [] }).success).toBe(false)
    expect(createMessageInputSchema.safeParse({ ...input, contactIds: tooMany }).success).toBe(false)
    expect(createMessageInputSchema.safeParse({ ...input, contactIds: ['a'], body: '   ' }).success).toBe(false)
  })

  describe('composer form', () => {
    afterEach(() => vi.useRealTimers())

    const form = { contactIds: ['a'], body: 'Oi', date: '2026-10-01', time: '12:00' }

    it('ignores date and time when sending now', () => {
      expect(messageFormSchema.safeParse({ ...form, mode: 'now', date: '', time: '' }).success).toBe(true)
    })

    it('requires a future date and time when scheduling', () => {
      vi.useFakeTimers({ now: new Date(2026, 9, 1, 12, 0) })

      const schedule = (time: string) => messageFormSchema.safeParse({ ...form, mode: 'schedule', time })
      expect(schedule('12:01').success).toBe(true)
      expect(schedule('12:00').error?.issues[0]).toMatchObject({ path: ['time'] })
      expect(schedule('').error?.issues[0]).toMatchObject({ path: ['time'] })
    })
  })
})
