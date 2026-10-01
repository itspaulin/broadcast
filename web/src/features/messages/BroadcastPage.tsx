import { Skeleton, Typography } from '@mui/material'
import { MessageSquare } from 'lucide-react'
import { useState } from 'react'
import { EmptyState } from '../../components/EmptyState'
import { LoadError } from '../../components/LoadError'
import { useCurrentUser } from '../auth/authContext'
import { useConnectionContext } from '../connections/connectionContext'
import { MessageCard } from './MessageCard'
import { countMessages, filterMessages, type MessageFilter } from './messages'
import { MessagesFilter } from './MessagesFilter'
import { useMessages } from './messagesService'

const RULE = 'border-(--mui-palette-divider)'

const EMPTY_FILTER: Record<Exclude<MessageFilter, 'all'>, string> = {
  scheduled: 'Nenhuma mensagem agendada.',
  sent: 'Nenhuma mensagem enviada.',
}

export const BroadcastPage = () => {
  const user = useCurrentUser()
  const { connection, contacts } = useConnectionContext()
  const messages = useMessages(user.uid, connection.id)
  const [filter, setFilter] = useState<MessageFilter>('all')

  const visible = filterMessages(messages.data, filter)
  const hasMessages = messages.data.length > 0

  return (
    <section aria-label="Mensagens" className="flex max-w-[1064px] flex-col">
      <div className={`flex flex-wrap items-center gap-x-4 gap-y-3 border-b-2 px-4 py-3 md:px-8 md:py-5 ${RULE}`}>
        <Typography variant="h6" component="h2" className="mr-auto max-md:sr-only">
          Mensagens
        </Typography>
        <MessagesFilter value={filter} counts={countMessages(messages.data)} onChange={setFilter} />
      </div>

      {messages.loading && (
        <div aria-label="Carregando mensagens" role="status">
          {[0, 1, 2].map((row) => (
            <div key={row} className={`flex flex-col gap-3 border-b px-4 py-5 md:px-8 ${RULE}`}>
              <div className="flex gap-3">
                <Skeleton width={64} height={16} />
                <Skeleton width={110} height={16} />
              </div>
              <Skeleton width="80%" height={12} />
              <Skeleton width="55%" height={12} />
            </div>
          ))}
        </div>
      )}

      {messages.error && (
        <div className="p-4 md:px-8 md:py-6">
          <LoadError
            title="Não foi possível carregar as mensagens."
            hint="As agendadas continuam programadas e serão enviadas no horário, mesmo assim."
            onRetry={messages.retry}
          />
        </div>
      )}

      {!messages.loading && !messages.error && !hasMessages && (
        <div className="px-4 md:px-8">
          <EmptyState
            icon={<MessageSquare size={32} strokeWidth={1.75} />}
            title="Nenhuma mensagem ainda"
            description="As mensagens desta conexão aparecem aqui, com o status de cada envio."
          />
        </div>
      )}

      {hasMessages && filter !== 'all' && visible.length === 0 && (
        <Typography color="text.secondary" className="px-4 py-6 md:px-8">
          {EMPTY_FILTER[filter]}
        </Typography>
      )}

      {visible.length > 0 && (
        <ul className="m-0 list-none p-0">
          {visible.map((message) => (
            <MessageCard key={message.id} message={message} contacts={contacts.data} />
          ))}
        </ul>
      )}
    </section>
  )
}
