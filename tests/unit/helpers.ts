import type { Contact, Message, Timestamp, WithId } from '@broadcast/shared'

export const MINUTE_MS = 60 * 1000
export const HOUR_MS = 60 * MINUTE_MS

export const at = (millis: number): Timestamp => ({ toMillis: () => millis })

export const contact = (id: string, name: string): WithId<Contact> => ({
  id,
  clientId: 'client-1',
  connectionId: 'connection-1',
  name,
  phone: '+5511999999999',
  createdAt: at(0),
  updatedAt: at(0),
})

export const message = (id: string, overrides: Partial<Message> = {}): WithId<Message> => ({
  id,
  clientId: 'client-1',
  connectionId: 'connection-1',
  contactIds: ['a'],
  recipients: {},
  body: 'Promoção de hoje',
  status: 'scheduled',
  scheduledAt: at(HOUR_MS),
  sentAt: null,
  editedAt: null,
  createdAt: at(0),
  updatedAt: at(0),
  ...overrides,
})
