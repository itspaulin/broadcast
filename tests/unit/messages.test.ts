import { describe, expect, it } from 'vitest'
import {
  countMessages,
  filterMessages,
  sortMessages,
  summarizeRecipients,
  toggleRecipient,
  toggleRecipients,
} from '../../web/src/features/messages/messages.ts'
import { formatDuration, formatPhone, formatWhen } from '../../web/src/lib/format.ts'
import { at, contact, HOUR_MS, message, MINUTE_MS } from './helpers.ts'

const sent = (id: string, sentAt: number) => message(id, { status: 'sent', scheduledAt: null, sentAt: at(sentAt) })
const scheduled = (id: string, scheduledAt: number) => message(id, { scheduledAt: at(scheduledAt) })

describe('message list', () => {
  const messages = [sent('old', 1000), scheduled('later', 9000), sent('recent', 5000), scheduled('next', 7000)]

  it('puts scheduled first (next to send on top), then sent (most recent on top)', () => {
    expect(sortMessages(messages).map((item) => item.id)).toEqual(['next', 'later', 'recent', 'old'])
  })

  it('filters by status and counts each filter', () => {
    expect(filterMessages(messages, 'scheduled').map((item) => item.id)).toEqual(['later', 'next'])
    expect(filterMessages(messages, 'all')).toHaveLength(4)
    expect(countMessages(messages)).toEqual({ all: 4, scheduled: 2, sent: 2 })
  })
})

describe('summarizeRecipients', () => {
  const contacts = [contact('a', 'Ana'), contact('b', 'Bruno'), contact('c', 'Carla'), contact('d', 'Diego')]

  it('names up to three recipients', () => {
    expect(summarizeRecipients(['a'], contacts)).toBe('Ana')
    expect(summarizeRecipients(['b', 'a'], contacts)).toBe('Ana e Bruno')
    expect(summarizeRecipients(['a', 'b', 'c'], contacts)).toBe('Ana, Bruno e Carla')
  })

  it('says "todos" when every contact is selected', () => {
    expect(summarizeRecipients(['a', 'b', 'c', 'd'], contacts)).toBe('Todos os 4 contatos')
  })

  it('names two and counts the rest beyond three', () => {
    const many = [...contacts, contact('e', 'Eduarda')]
    expect(summarizeRecipients(['a', 'b', 'c', 'd'], many)).toBe('Ana, Bruno e mais 2')
  })

  it('still counts contacts that were deleted', () => {
    expect(summarizeRecipients(['a', 'gone'], contacts)).toBe('Ana e mais 1')
    expect(summarizeRecipients(['gone', 'gone-too'], contacts)).toBe('2 contatos')
  })
})

describe('recipient selection', () => {
  it('toggles one contact', () => {
    expect(toggleRecipient(['a'], 'b')).toEqual(['a', 'b'])
    expect(toggleRecipient(['a', 'b'], 'a')).toEqual(['b'])
  })

  it('selects or clears only the visible contacts, keeping the rest', () => {
    expect(toggleRecipients(['a'], ['b', 'c'], true)).toEqual(['a', 'b', 'c'])
    expect(toggleRecipients(['a', 'b'], ['b', 'c'], true)).toEqual(['a', 'b', 'c'])
    expect(toggleRecipients(['a', 'b', 'c'], ['b', 'c'], false)).toEqual(['a'])
  })
})

describe('formatting', () => {
  it('formats durations for countdowns', () => {
    expect(formatDuration(20 * 1000)).toBe('1 min')
    expect(formatDuration(45 * MINUTE_MS)).toBe('45 min')
    expect(formatDuration(2 * HOUR_MS)).toBe('2 h')
    expect(formatDuration(2 * HOUR_MS + 15 * MINUTE_MS)).toBe('2 h 15 min')
    expect(formatDuration(24 * HOUR_MS)).toBe('1 dia')
    expect(formatDuration(58 * HOUR_MS)).toBe('2 dias e 10 h')
  })

  it('formats dates relative to today in the local time zone', () => {
    const now = new Date(2026, 9, 1, 12, 0).getTime()
    expect(formatWhen(new Date(2026, 9, 1, 14, 30).getTime(), now)).toBe('hoje, 14:30')
    expect(formatWhen(new Date(2026, 9, 2, 7, 0).getTime(), now)).toBe('amanhã, 07:00')
    expect(formatWhen(new Date(2026, 8, 30, 17, 40).getTime(), now)).toBe('ontem, 17:40')
    expect(formatWhen(new Date(2026, 9, 10, 7, 30).getTime(), now)).toBe('10/10, 07:30')
  })

  it('masks stored phones', () => {
    expect(formatPhone('+5511987654321')).toBe('(11) 98765-4321')
    expect(formatPhone('+551133224455')).toBe('(11) 3322-4455')
  })
})
