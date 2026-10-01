export const COLLECTIONS = {
  clients: 'clients',
  connections: 'connections',
  contacts: 'contacts',
  messages: 'messages',
  messageRevisions: 'messageRevisions',
} as const

export const FUNCTIONS_REGION = 'southamerica-east1'

export const NAME_MAX_LENGTH = 80
export const PASSWORD_MIN_LENGTH = 6
export const MESSAGE_BODY_MAX_LENGTH = 4096
export const MESSAGE_RECIPIENTS_MAX = 500

export const PAST_SCHEDULE_MESSAGE = 'Esse horário já passou. Escolha um horário no futuro.'

export const EDIT_WINDOW_MS = 15 * 60 * 1000
export const WRITE_BATCH_LIMIT = 500

export const MESSAGE_STATUS_LABEL = {
  scheduled: 'Agendada',
  sent: 'Enviada',
} as const

export const RECIPIENT_STATUS_LABEL = {
  sent: 'Enviado',
  delivered: 'Entregue',
  read: 'Lido',
} as const
