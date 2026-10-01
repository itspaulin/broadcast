import { canEditMessage, editMinutesLeft, type Contact, type Message, type WithId } from '@broadcast/shared'
import { Button, IconButton, Typography } from '@mui/material'
import { Clock, Pencil, Trash2, Users } from 'lucide-react'
import { capitalize, formatDuration, formatWhen } from '../../lib/format'
import { DeliveryProgress } from './DeliveryProgress'
import { messageMoment, summarizeRecipients } from './messages'
import { MessageStatusChip } from './MessageStatusChip'

export type MessageActions = {
  onEdit: (message: WithId<Message>) => void
  onEditText: (message: WithId<Message>) => void
  onDelete: (message: WithId<Message>) => void
}

type Props = MessageActions & {
  message: WithId<Message>
  contacts: WithId<Contact>[]
  now: number
  // Highlights the scheduled message currently loaded in the composer.
  editing: boolean
}

export const MessageCard = ({ message, contacts, now, editing, onEdit, onEditText, onDelete }: Props) => {
  const scheduled = message.status === 'scheduled'
  const moment = messageMoment(message)

  return (
    <li
      className={`flex flex-col gap-2.5 border-b border-(--mui-palette-divider) px-4 py-5 md:px-8 ${editing ? 'bg-(--mui-palette-background-paper)' : ''}`}
    >
      <div className="flex items-center gap-3">
        <div className="flex flex-1 flex-wrap items-center gap-x-3 gap-y-2">
          <MessageStatusChip status={message.status} />
          <span className="text-sm font-semibold">{capitalize(formatWhen(moment, now))}</span>
          {scheduled && (
            <span className="text-sm font-semibold text-(--mui-palette-error-main)">
              {/* Due but not picked up yet: the scheduler runs once a minute. */}
              {moment > now ? `envia em ${formatDuration(moment - now)}` : 'enviando…'}
            </span>
          )}
          {message.editedAt && (
            <span className="bg-(--mui-palette-grey-200) px-2 py-0.5 text-xs italic">editado</span>
          )}
        </div>
        <div className="-my-2 flex gap-0.5">
          {scheduled && (
            <IconButton aria-label="Editar mensagem" onClick={() => onEdit(message)}>
              <Pencil size={16} />
            </IconButton>
          )}
          <IconButton aria-label="Excluir mensagem" onClick={() => onDelete(message)}>
            <Trash2 size={16} />
          </IconButton>
        </div>
      </div>
      <Typography className="max-w-[620px] text-pretty break-words whitespace-pre-wrap">{message.body}</Typography>
      <Typography variant="body2" className="flex items-center gap-1.5 text-(--mui-palette-grey-800)">
        <Users size={14} />
        {summarizeRecipients(message.contactIds, contacts)}
      </Typography>
      {!scheduled && <DeliveryProgress message={message} contacts={contacts} now={now} />}
      {!scheduled && canEditMessage(message, now) && (
        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            variant="outlined"
            color="inherit"
            size="small"
            startIcon={<Pencil size={14} />}
            className="text-[13px]"
            onClick={() => onEditText(message)}
          >
            Editar texto
          </Button>
          <span className="flex items-center gap-1.5 text-[13px] font-semibold text-(--mui-palette-error-main)">
            <Clock size={14} />
            editável por mais {editMinutesLeft(message, now)} min
          </span>
        </div>
      )}
    </li>
  )
}
