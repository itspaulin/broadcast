import type { Contact, WithId } from '@broadcast/shared'
import { Button, Typography } from '@mui/material'
import { ChevronRight, TriangleAlert } from 'lucide-react'
import { useState } from 'react'
import { plural } from '../../lib/format'
import { summarizeRecipients } from './messages'
import { RecipientsList } from './RecipientsList'
import { RecipientsScreen } from './RecipientsScreen'

type Props = {
  contacts: WithId<Contact>[]
  value: string[]
  onChange: (contactIds: string[]) => void
  error?: string
  // On phones the list does not fit inside the composer: a summary opens it as its own screen.
  compact: boolean
}

const RULE = 'border-(--mui-palette-divider)'

export const RecipientsPicker = ({ contacts, value, onChange, error, compact }: Props) => {
  const [choosing, setChoosing] = useState(false)
  const summary = value.length > 0 ? summarizeRecipients(value, contacts) : 'Nenhum contato selecionado.'

  const errorLine = error && (
    <Typography variant="body2" role="alert" className="flex items-center gap-1.5 text-(--mui-palette-error-dark)">
      <TriangleAlert size={14} />
      {error}
    </Typography>
  )

  if (compact) {
    return (
      <div className="flex flex-col gap-2">
        <span className="text-[13px] font-semibold">1 · Destinatários</span>
        <button
          type="button"
          onClick={() => setChoosing(true)}
          className={`flex min-h-14 cursor-pointer items-center gap-3 border bg-(--mui-palette-background-paper) px-4 py-2.5 text-left font-[inherit] text-inherit ${error ? 'border-2 border-(--mui-palette-error-main)' : RULE}`}
        >
          <span className="min-w-0 flex-1">
            <span className="block text-base font-extrabold">
              {value.length > 0 ? plural(value.length, 'contato', 'contatos') : 'Escolher contatos'}
            </span>
            <span className="block truncate text-[13px] text-(--mui-palette-text-secondary)">{summary}</span>
          </span>
          <ChevronRight size={20} />
        </button>
        {errorLine}
        {choosing && (
          <RecipientsScreen
            contacts={contacts}
            value={value}
            onConfirm={(contactIds) => {
              onChange(contactIds)
              setChoosing(false)
            }}
            onClose={() => setChoosing(false)}
          />
        )}
      </div>
    )
  }

  return (
    <fieldset className="m-0 flex min-w-0 flex-col gap-2 border-0 p-0">
      <div className="flex items-baseline justify-between">
        <legend className="p-0 text-[13px] font-semibold">1 · Destinatários</legend>
        <span
          className={`text-[13px] font-semibold ${value.length > 0 ? 'text-(--mui-palette-error-main)' : 'text-(--mui-palette-text-secondary)'}`}
        >
          {value.length} de {contacts.length} selecionados
        </span>
      </div>

      <RecipientsList contacts={contacts} value={value} onChange={onChange} />

      {errorLine || (
        <div className="flex min-h-7 items-center gap-2">
          <Typography variant="body2" noWrap className="flex-1 text-(--mui-palette-grey-800)">
            {summary}
          </Typography>
          {value.length > 0 && (
            <Button size="small" className="min-h-7 py-1 text-[13px]" onClick={() => onChange([])}>
              Limpar
            </Button>
          )}
        </div>
      )}
    </fieldset>
  )
}
