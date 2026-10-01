import type { Message, WithId } from '@broadcast/shared'
import { Button, Skeleton, Typography, useMediaQuery, useTheme } from '@mui/material'
import { ChevronRight, MessageSquare, Plus, Users, X } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router'
import { EmptyState } from '../../components/EmptyState'
import { FullScreenDialog } from '../../components/FullScreenDialog'
import { LoadError } from '../../components/LoadError'
import { useNow } from '../../lib/useNow'
import { useCurrentUser } from '../auth/authContext'
import { useConnectionContext } from '../connections/connectionContext'
import { DeleteMessageDialog } from './DeleteMessageDialog'
import { EditSentMessageDialog } from './EditSentMessageDialog'
import { MessageCard } from './MessageCard'
import { MessageComposer } from './MessageComposer'
import { countMessages, filterMessages, type MessageFilter } from './messages'
import { MessagesFilter } from './MessagesFilter'
import { useMessages } from './messagesService'

// Dialogs keep their target after closing so the exit animation does not flash empty content.
type DialogState = { open: boolean; message?: WithId<Message> }

const RULE = 'border-(--mui-palette-divider)'

const EMPTY_FILTER: Record<Exclude<MessageFilter, 'all'>, string> = {
  scheduled: 'Nenhuma mensagem agendada.',
  sent: 'Nenhuma mensagem enviada.',
}

export const BroadcastPage = () => {
  const user = useCurrentUser()
  const { connection, contacts } = useConnectionContext()
  const messages = useMessages(user.uid, connection.id)
  const isDesktop = useMediaQuery(useTheme().breakpoints.up('md'))
  const [filter, setFilter] = useState<MessageFilter>('all')
  const [composing, setComposing] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingText, setEditingText] = useState<DialogState>({ open: false })
  const [deleting, setDeleting] = useState<DialogState>({ open: false })
  const now = useNow()

  // Read from the live list: if the message is sent or deleted meanwhile, the edit ends by itself.
  const editing = messages.data.find((message) => message.id === editingId && message.status === 'scheduled')
  const closeComposer = () => {
    setComposing(false)
    setEditingId(null)
  }
  const composer = (layout: 'panel' | 'screen') => (
    <MessageComposer key={editing?.id ?? 'new'} layout={layout} editing={editing} onDone={closeComposer} />
  )

  const visible = filterMessages(messages.data, filter)
  const hasMessages = messages.data.length > 0
  const noContacts = !contacts.loading && !contacts.error && contacts.data.length === 0
  const loaded = !messages.loading && !messages.error

  const noRecipients = (
    <EmptyState
      icon={<Users size={32} strokeWidth={1.75} />}
      title="Ainda não há para quem enviar"
      description={`Mensagens em ${connection.name} só podem ir para contatos desta conexão. Adicione pelo menos um contato e volte aqui para escrever.`}
      action={
        <Button
          component={Link}
          to="../contacts"
          variant="contained"
          size="large"
          endIcon={<ChevronRight size={18} />}
        >
          Ir para Contatos
        </Button>
      }
    />
  )

  // Nothing to write to and nothing written yet: the explanation takes the whole tab.
  if (noContacts && loaded && !hasMessages) return <div className="px-4 py-6 md:px-8">{noRecipients}</div>

  return (
    <div className="md:grid md:grid-cols-[460px_minmax(0,1fr)]">
      {isDesktop && (
        <div className={`border-r-2 px-8 py-6 ${RULE}`}>{noContacts ? noRecipients : composer('panel')}</div>
      )}

      <section aria-label="Mensagens" className="flex min-w-0 flex-col">
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

        {loaded && !hasMessages && (
          <div className="px-4 md:px-8">
            <EmptyState
              icon={<MessageSquare size={32} strokeWidth={1.75} />}
              title="Nenhuma mensagem ainda"
              description="Escolha os contatos e escreva a primeira. Ela aparece aqui com o status de cada envio."
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
              <MessageCard
                key={message.id}
                message={message}
                contacts={contacts.data}
                now={now}
                editing={message.id === editing?.id}
                onEdit={(target) => setEditingId(target.id)}
                onEditText={(target) => setEditingText({ open: true, message: target })}
                onDelete={(target) => setDeleting({ open: true, message: target })}
              />
            ))}
          </ul>
        )}
      </section>

      {!isDesktop && noContacts && <div className="px-4 pb-6">{noRecipients}</div>}

      {!isDesktop && !noContacts && (
        // Leaves room for the fixed action below the last message.
        <div className="h-24">
          <div className="fixed inset-x-4 bottom-5">
            <Button
              variant="contained"
              fullWidth
              startIcon={<Plus size={18} />}
              onClick={() => setComposing(true)}
              className="min-h-13 justify-center text-base shadow-[0_3px_10px_rgba(45,43,43,0.16)]"
            >
              Nova mensagem
            </Button>
          </div>
          <FullScreenDialog
            open={composing || Boolean(editing)}
            title={editing ? 'Editar mensagem' : 'Nova mensagem'}
            closeIcon={<X size={22} />}
            closeLabel="Fechar"
            onClose={closeComposer}
          >
            {composer('screen')}
          </FullScreenDialog>
        </div>
      )}

      <EditSentMessageDialog
        open={editingText.open}
        message={editingText.message}
        onClose={() => setEditingText((current) => ({ ...current, open: false }))}
      />
      <DeleteMessageDialog
        open={deleting.open}
        message={deleting.message}
        onClose={() => setDeleting((current) => ({ ...current, open: false }))}
      />
    </div>
  )
}
