import {
  recipientStatusAt,
  recipientStatusTime,
  recipientTimeline,
  type Contact,
  type Message,
  type RecipientStatus,
  type WithId,
} from '@broadcast/shared'

export type RecipientRow = {
  contactId: string
  // Null for a contact deleted after the message was sent.
  contact: WithId<Contact> | null
  status: RecipientStatus
  at: number
}

// Recipients in the order of the contacts list (by name), deleted contacts last.
export const recipientRows = (message: WithId<Message>, contacts: WithId<Contact>[], now: number): RecipientRow[] => {
  const sentAt = message.sentAt?.toMillis() ?? now
  const byId = new Map(contacts.map((contact) => [contact.id, contact]))
  const known = contacts.filter((contact) => message.contactIds.includes(contact.id)).map((contact) => contact.id)
  const deleted = message.contactIds.filter((contactId) => !byId.has(contactId))

  return [...known, ...deleted].map((contactId) => {
    const timeline = recipientTimeline(message.id, contactId, sentAt)
    const status = recipientStatusAt(timeline, now)
    return { contactId, contact: byId.get(contactId) ?? null, status, at: recipientStatusTime(timeline, status) }
  })
}

export const countStatuses = (rows: RecipientRow[]): Record<RecipientStatus, number> => ({
  read: rows.filter((row) => row.status === 'read').length,
  delivered: rows.filter((row) => row.status === 'delivered').length,
  sent: rows.filter((row) => row.status === 'sent').length,
})
