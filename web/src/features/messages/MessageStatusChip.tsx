import { MESSAGE_STATUS_LABEL, type MessageStatus } from '@broadcast/shared'
import { Clock, Send } from 'lucide-react'

const STYLE: Record<MessageStatus, string> = {
  scheduled: 'border border-(--mui-palette-error-main) text-(--mui-palette-error-main)',
  sent: 'bg-(--mui-palette-text-primary) text-(--mui-palette-background-default)',
}

export const MessageStatusChip = ({ status }: { status: MessageStatus }) => (
  <span className={`flex items-center gap-1.5 px-2 py-1 text-xs font-semibold ${STYLE[status]}`}>
    {status === 'scheduled' ? <Clock size={12} /> : <Send size={12} />}
    {MESSAGE_STATUS_LABEL[status]}
  </span>
)
