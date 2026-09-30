export const COLLECTIONS = {
  clients: 'clients',
  connections: 'connections',
  contacts: 'contacts',
  messages: 'messages',
  messageRevisions: 'messageRevisions',
} as const

export const NAME_MAX_LENGTH = 80
export const MESSAGE_BODY_MAX_LENGTH = 4096

export const EDIT_WINDOW_MS = 15 * 60 * 1000
export const SCHEDULER_BATCH_SIZE = 500

export const MESSAGE_STATUS_LABEL = {
  scheduled: 'Agendada',
  sent: 'Enviada',
} as const

export const RECIPIENT_STATUS_LABEL = {
  sent: 'Enviado',
  delivered: 'Entregue',
  read: 'Lido',
} as const
