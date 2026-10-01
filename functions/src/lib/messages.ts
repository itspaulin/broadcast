import { isInFuture, type RecipientStatus } from '@broadcast/shared'
import type { DocumentSnapshot } from 'firebase-admin/firestore'
import { HttpsError } from 'firebase-functions/v2/https'

export const sentRecipients = (contactIds: string[]): Record<string, RecipientStatus> =>
  Object.fromEntries(contactIds.map((contactId) => [contactId, 'sent']))

export const assertInFuture = (scheduledAt: number) => {
  if (!isInFuture(scheduledAt, Date.now())) {
    throw new HttpsError('invalid-argument', 'Escolha uma data e hora no futuro.')
  }
}

export const assertContactsOfConnection = (contacts: DocumentSnapshot[], clientId: string, connectionId: string) => {
  const allFromConnection = contacts.every(
    (contact) => contact.exists && contact.get('clientId') === clientId && contact.get('connectionId') === connectionId,
  )
  if (!allFromConnection) {
    throw new HttpsError('failed-precondition', 'Um dos contatos não existe mais. Atualize a seleção.')
  }
}
