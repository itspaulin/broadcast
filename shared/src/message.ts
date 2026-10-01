import { EDIT_WINDOW_MS } from './constants.ts'
import type { Message } from './types.ts'

export const isInFuture = (millis: number, nowMillis: number) => millis > nowMillis

export const isDue = (message: Pick<Message, 'status' | 'scheduledAt'>, nowMillis: number) =>
  message.status === 'scheduled' &&
  message.scheduledAt !== null &&
  message.scheduledAt.toMillis() <= nowMillis

export const canEditMessage = (message: Pick<Message, 'status' | 'sentAt'>, nowMillis: number) =>
  message.status === 'scheduled' ||
  (message.sentAt !== null && nowMillis - message.sentAt.toMillis() < EDIT_WINDOW_MS)

// No zone suffix, so the browser reads it in the user's time zone; the result is UTC millis.
export const localDateTimeToMillis = (date: string, time: string) => new Date(`${date}T${time}`).getTime()

// Whole minutes left to edit a sent message, rounded up so "1 min" shows until the window closes.
export const editMinutesLeft = (message: Pick<Message, 'sentAt'>, nowMillis: number) =>
  message.sentAt === null ? 0 : Math.max(0, Math.ceil((message.sentAt.toMillis() + EDIT_WINDOW_MS - nowMillis) / 60_000))
