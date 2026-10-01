import { RECIPIENT_STATUS_LABEL, type Contact, type Message, type RecipientStatus, type WithId } from '@broadcast/shared'
import { Button, Collapse } from '@mui/material'
import { Check, CheckCheck, ChevronDown, ChevronUp } from 'lucide-react'
import { useState } from 'react'
import { formatPhone, formatTime } from '../../lib/format'
import { countStatuses, recipientRows } from './delivery'

type Props = {
  message: WithId<Message>
  contacts: WithId<Contact>[]
  now: number
}

const RULE = 'border-(--mui-palette-divider)'
const READ = 'font-semibold text-(--mui-palette-error-main)'
const MUTED = 'text-(--mui-palette-text-secondary)'

const STATUS_STYLE: Record<RecipientStatus, string> = { read: READ, delivered: '', sent: MUTED }

const StatusIcon = ({ status, size }: { status: RecipientStatus; size: number }) =>
  status === 'sent' ? <Check size={size} /> : <CheckCheck size={size} strokeWidth={status === 'read' ? 2.6 : 2} />

export const DeliveryProgress = ({ message, contacts, now }: Props) => {
  const [expanded, setExpanded] = useState(false)
  const rows = recipientRows(message, contacts, now)
  const counts = countStatuses(rows)
  const share = (count: number) => `${(count / rows.length) * 100}%`

  return (
    <div className="mt-1 flex flex-col gap-2">
      <div
        role="img"
        aria-label={`${counts.read} lidos, ${counts.delivered} entregues, ${counts.sent} só enviados`}
        className="flex h-2 max-w-[620px] bg-(--mui-palette-grey-300)"
      >
        <span className="bg-(--mui-palette-primary-main)" style={{ width: share(counts.read) }} />
        <span className="bg-(--mui-palette-text-primary)" style={{ width: share(counts.delivered) }} />
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px]">
        <span className={`flex items-center gap-1.5 ${READ}`}>
          <StatusIcon status="read" size={15} />
          {counts.read} {counts.read === 1 ? 'lido' : 'lidos'}
        </span>
        <span className="flex items-center gap-1.5">
          <StatusIcon status="delivered" size={15} />
          {counts.delivered} {counts.delivered === 1 ? 'entregue' : 'entregues'}
        </span>
        <span className={`flex items-center gap-1.5 ${MUTED}`}>
          <StatusIcon status="sent" size={15} />
          {counts.sent} só {counts.sent === 1 ? 'enviado' : 'enviados'}
        </span>
        <Button
          size="small"
          className="ml-auto text-[13px]"
          aria-expanded={expanded}
          endIcon={expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          onClick={() => setExpanded((current) => !current)}
        >
          {expanded ? 'Ocultar destinatários' : 'Ver destinatários'}
        </Button>
      </div>

      <Collapse in={expanded} unmountOnExit>
        <ul className={`m-0 max-h-[300px] list-none overflow-auto border-t-2 p-0 ${RULE}`}>
          {rows.map((row) => (
            <li
              key={row.contactId}
              className={`grid min-h-10 grid-cols-[minmax(0,1fr)_auto_3rem] items-center gap-x-3 border-b py-1 text-sm md:grid-cols-[minmax(0,1fr)_140px_120px_3rem] ${RULE}`}
            >
              <span className="flex min-w-0 flex-col md:contents">
                <span className={`truncate ${row.contact ? '' : `italic ${MUTED}`}`}>
                  {row.contact?.name ?? 'Contato excluído'}
                </span>
                <span className={`text-[13px] tabular-nums ${MUTED}`}>
                  {row.contact ? formatPhone(row.contact.phone) : ''}
                </span>
              </span>
              <span className={`flex items-center gap-1.5 ${STATUS_STYLE[row.status]}`}>
                <StatusIcon status={row.status} size={15} />
                {RECIPIENT_STATUS_LABEL[row.status]}
              </span>
              <span className={`text-right text-[13px] tabular-nums ${MUTED}`}>{formatTime(row.at)}</span>
            </li>
          ))}
        </ul>
      </Collapse>
    </div>
  )
}
