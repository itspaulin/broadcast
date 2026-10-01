import { isInFuture } from '@broadcast/shared'
import type { DocumentSnapshot } from 'firebase-admin/firestore'
import { HttpsError } from 'firebase-functions/v2/https'

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
