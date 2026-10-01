import type { Message, WithId } from '@broadcast/shared'
import { Typography } from '@mui/material'
import { ConfirmDeleteDialog } from '../../components/ConfirmDeleteDialog'
import { callableErrorMessage } from '../../lib/callableErrors'
import { plural } from '../../lib/format'
import { deleteMessage } from './messagesService'

type Props = {
  open: boolean
  message?: WithId<Message>
  onClose: () => void
}

const NOTE = 'Esta ação não pode ser desfeita.'

export const DeleteMessageDialog = ({ open, message, onClose }: Props) => {
  if (!message) return null

  const scheduled = message.status === 'scheduled'
  const recipients = message.contactIds.length

  return (
    <ConfirmDeleteDialog
      open={open}
      title={scheduled ? 'Excluir mensagem agendada?' : 'Excluir mensagem enviada?'}
      confirmLabel="Excluir mensagem"
      loadingHint=""
      // Nothing to look up: everything the deletion affects is already in the message.
      describe={() =>
        Promise.resolve(
          <>
            <Typography>
              {scheduled
                ? `Ela não será enviada para ${plural(recipients, 'contato', 'contatos')}. ${NOTE}`
                : `Ela sai do histórico desta conexão, junto com o status de ${plural(recipients, 'destinatário', 'destinatários')}. ${NOTE}`}
            </Typography>
            <Typography
              variant="body2"
              className="line-clamp-2 border border-(--mui-palette-divider) bg-(--mui-palette-background-default) px-3 py-2.5 text-sm whitespace-pre-wrap"
            >
              {message.body}
            </Typography>
          </>,
        )
      }
      onConfirm={() => deleteMessage(message.id)}
      errorMessage={(error) => callableErrorMessage(error, 'Não foi possível excluir a mensagem. Tente novamente.')}
      onClose={onClose}
    />
  )
}
