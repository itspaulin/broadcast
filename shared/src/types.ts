import type { MESSAGE_STATUS_LABEL, RECIPIENT_STATUS_LABEL } from './constants.ts'

// Satisfied by both the firebase-admin and the web SDK Timestamp classes.
export type Timestamp = { toMillis: () => number }

export type WithId<T> = T & { id: string }

export type MessageStatus = keyof typeof MESSAGE_STATUS_LABEL
export type RecipientStatus = keyof typeof RECIPIENT_STATUS_LABEL

type Owned = {
  clientId: string
  createdAt: Timestamp
  updatedAt: Timestamp
}

export type Client = {
  name: string
  email: string
  createdAt: Timestamp
}

export type Connection = Owned & {
  name: string
}

export type Contact = Owned & {
  connectionId: string
  name: string
  phone: string
}

export type Message = Owned & {
  connectionId: string
  contactIds: string[]
  recipients: Record<string, RecipientStatus>
  body: string
  status: MessageStatus
  scheduledAt: Timestamp | null
  sentAt: Timestamp | null
  editedAt: Timestamp | null
}

export type MessageRevision = {
  clientId: string
  messageId: string
  body: string
  contactIds: string[]
  scheduledAt: Timestamp | null
  createdAt: Timestamp
}
