import type { Contact, WithId } from '@broadcast/shared'

const normalize = (text: string) =>
  text
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()

const looksLikePhone = (term: string) => /^[\d\s()+-]+$/.test(term)

// "joao" finds "João"; a term made only of phone characters is matched against the stored
// digits, so any mask (or none) works.
export const searchContacts = (contacts: WithId<Contact>[], term: string) => {
  const trimmed = term.trim()
  if (!trimmed) return contacts
  if (looksLikePhone(trimmed)) {
    const digits = trimmed.replace(/\D/g, '')
    return contacts.filter((contact) => contact.phone.includes(digits))
  }
  const needle = normalize(trimmed)
  return contacts.filter((contact) => normalize(contact.name).includes(needle))
}
