import type { Contact, Message, WithId } from '@broadcast/shared'
import { Alert, Typography } from '@mui/material'
import { Info } from 'lucide-react'
import { ConfirmDeleteDialog } from '../../components/ConfirmDeleteDialog'
import { callableErrorMessage } from '../../lib/callableErrors'
import { formatWhen, plural, truncate } from '../../lib/format'
import { useCurrentUser } from '../auth/authContext'
import { deleteContact, findScheduledMessagesWith } from './contactsService'

const NOTE = 'Mensagens já enviadas continuam no histórico. Esta ação não pode ser desfeita.'
const PREVIEW_LENGTH = 28
const LISTED_MESSAGES = 3

const describeImpact = (messages: Message[]) => {
  // A scheduled message whose only recipient is this contact has no one left to send to.
  const emptied = messages.filter((message) => message.contactIds.length === 1)

  return (
    <>
      <Typography>
        {messages.length === 0 ? (
          'Nenhuma mensagem agendada será alterada.'
        ) : (
          <>
            O contato será removido de{' '}
            <strong className="font-semibold">
              {plural(messages.length, 'mensagem agendada', 'mensagens agendadas')}
            </strong>
            .
            {emptied.length === 1 && ' 1 delas ficará sem destinatários e será excluída.'}
            {emptied.length > 1 && ` ${emptied.length} delas ficarão sem destinatários e serão excluídas.`}
          </>
        )}
      </Typography>
      {emptied.slice(0, LISTED_MESSAGES).map((message, index) => (
        <Alert key={index} severity="error" icon={<Info size={16} />}>
          "{truncate(message.body, PREVIEW_LENGTH)}"
          {message.scheduledAt && ` (${formatWhen(message.scheduledAt.toMillis())})`} será excluída.
        </Alert>
      ))}
      <Typography variant="body2" color="text.secondary">
        {NOTE}
      </Typography>
    </>
  )
}

type Props = {
  open: boolean
  contact?: WithId<Contact>
  onClose: () => void
}

export const DeleteContactDialog = ({ open, contact, onClose }: Props) => {
  const user = useCurrentUser()

  if (!contact) return null

  return (
    <ConfirmDeleteDialog
      open={open}
      title={`Excluir "${contact.name}"?`}
      confirmLabel="Excluir contato"
      loadingHint="Verificando as mensagens agendadas deste contato…"
      describe={() =>
        findScheduledMessagesWith(user.uid, contact.id).then(describeImpact, () => (
          <Typography>
            O contato será removido das mensagens agendadas; as que ficarem sem destinatários serão excluídas. {NOTE}
          </Typography>
        ))
      }
      onConfirm={async () => {
        await deleteContact(contact.id)
      }}
      errorMessage={(error) => callableErrorMessage(error, 'Não foi possível excluir o contato. Tente novamente.')}
      onClose={onClose}
    />
  )
}
