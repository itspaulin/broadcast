import type { Contact, Message, MessageStatus, WithId } from '@broadcast/shared'
import { plural } from '../../lib/format'

export type MessageFilter = 'all' | MessageStatus

// The moment that matters for each status: when it will be sent, or when it was.
export const messageMoment = (message: Message) =>
  (message.status === 'scheduled' ? message.scheduledAt : message.sentAt)?.toMillis() ?? 0

// Scheduled first, next to be sent on top; then sent, most recent on top.
export const sortMessages = (messages: WithId<Message>[]) =>
  messages.toSorted((a, b) => {
    if (a.status !== b.status) return a.status === 'scheduled' ? -1 : 1
    return a.status === 'scheduled' ? messageMoment(a) - messageMoment(b) : messageMoment(b) - messageMoment(a)
  })

export const filterMessages = (messages: WithId<Message>[], filter: MessageFilter) =>
  filter === 'all' ? messages : messages.filter((message) => message.status === filter)

export const countMessages = (messages: WithId<Message>[]): Record<MessageFilter, number> => ({
  all: messages.length,
  scheduled: filterMessages(messages, 'scheduled').length,
  sent: filterMessages(messages, 'sent').length,
})

const NAMES_SHOWN = 2
const namesList = new Intl.ListFormat('pt-BR', { type: 'conjunction' })

// "Todos os 240 contatos", "Ana, Bruno e Carla" or "Ana, Bruno e mais 10". Sent messages may
// still reference deleted contacts: they count, but have no name to show.
export const summarizeRecipients = (contactIds: string[], contacts: WithId<Contact>[]) => {
  const ids = new Set(contactIds)
  const names = contacts.filter((contact) => ids.has(contact.id)).map((contact) => contact.name)

  if (names.length === 0) return plural(contactIds.length, 'contato', 'contatos')
  if (names.length === contacts.length && contactIds.length === contacts.length && contacts.length > 1) {
    return `Todos os ${contacts.length} contatos`
  }
  if (names.length === contactIds.length && names.length <= NAMES_SHOWN + 1) return namesList.format(names)

  const shown = names.slice(0, NAMES_SHOWN)
  return `${shown.join(', ')} e mais ${contactIds.length - shown.length}`
}

export const toggleRecipient = (selected: string[], contactId: string) =>
  selected.includes(contactId) ? selected.filter((id) => id !== contactId) : [...selected, contactId]

// With a search active, "select all" only touches the contacts on screen and keeps the rest
// of the selection as it was.
export const toggleRecipients = (selected: string[], visibleIds: string[], select: boolean) => {
  const visible = new Set(visibleIds)
  const others = selected.filter((id) => !visible.has(id))
  return select ? [...others, ...visibleIds] : others
}
