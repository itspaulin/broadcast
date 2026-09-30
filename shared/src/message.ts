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
