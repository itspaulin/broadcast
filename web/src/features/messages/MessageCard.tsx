import type { Contact, Message, WithId } from '@broadcast/shared'
import { Typography } from '@mui/material'
import { Users } from 'lucide-react'
import { capitalize, formatWhen } from '../../lib/format'
import { messageMoment, summarizeRecipients } from './messages'
import { MessageStatusChip } from './MessageStatusChip'

type Props = {
  message: WithId<Message>
  contacts: WithId<Contact>[]
}

export const MessageCard = ({ message, contacts }: Props) => (
  <li className="flex flex-col gap-2.5 border-b border-(--mui-palette-divider) px-4 py-5 md:px-8">
    <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
      <MessageStatusChip status={message.status} />
      <span className="text-sm font-semibold">{capitalize(formatWhen(messageMoment(message)))}</span>
      {message.editedAt && (
        <span className="bg-(--mui-palette-grey-200) px-2 py-0.5 text-xs italic">editado</span>
      )}
    </div>
    <Typography className="max-w-[620px] text-pretty break-words whitespace-pre-wrap">{message.body}</Typography>
    <Typography variant="body2" className="flex items-center gap-1.5 text-(--mui-palette-grey-800)">
      <Users size={14} />
      {summarizeRecipients(message.contactIds, contacts)}
    </Typography>
  </li>
)
