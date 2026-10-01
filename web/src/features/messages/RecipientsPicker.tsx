import type { Contact, WithId } from '@broadcast/shared'
import { Button, InputAdornment, TextField, Typography } from '@mui/material'
import { Search, TriangleAlert } from 'lucide-react'
import { useState } from 'react'
import { SquareCheckbox } from '../../components/SquareCheckbox'
import { formatPhone, plural } from '../../lib/format'
import { searchContacts } from '../contacts/searchContacts'
import { summarizeRecipients, toggleRecipient, toggleRecipients } from './messages'

type Props = {
  contacts: WithId<Contact>[]
  value: string[]
  onChange: (contactIds: string[]) => void
  error?: string
}

const RULE = 'border-(--mui-palette-divider)'
const ROW = `flex cursor-pointer items-center gap-3 px-3 hover:bg-[color-mix(in_srgb,var(--mui-palette-text-primary)_6%,transparent)]`

export const RecipientsPicker = ({ contacts, value, onChange, error }: Props) => {
  const [search, setSearch] = useState('')

  const visible = searchContacts(contacts, search)
  const visibleIds = visible.map((contact) => contact.id)
  const selectedVisible = visibleIds.filter((id) => value.includes(id)).length
  const allVisibleSelected = visible.length > 0 && selectedVisible === visible.length

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

      <TextField
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        placeholder="Buscar contato"
        fullWidth
        slotProps={{
          htmlInput: { 'aria-label': 'Buscar contato' },
          input: {
            startAdornment: (
              <InputAdornment position="start">
                <Search size={18} />
              </InputAdornment>
            ),
          },
        }}
      />

      <div className={`border bg-(--mui-palette-background-paper) ${RULE}`}>
        <label className={`${ROW} h-11 border-b-2 text-sm font-semibold ${RULE}`}>
          <SquareCheckbox
            checked={allVisibleSelected}
            indeterminate={selectedVisible > 0 && !allVisibleSelected}
            disabled={visible.length === 0}
            onChange={() => onChange(toggleRecipients(value, visibleIds, !allVisibleSelected))}
          />
          {search.trim()
            ? `Selecionar ${plural(visible.length, 'resultado', 'resultados')}`
            : `Selecionar todos (${contacts.length})`}
        </label>
        <ul className="m-0 max-h-[236px] list-none overflow-auto p-0">
          {visible.map((contact) => (
            <li key={contact.id} className={`border-b last:border-b-0 ${RULE}`}>
              <label className={`${ROW} h-10`}>
                <SquareCheckbox
                  checked={value.includes(contact.id)}
                  onChange={() => onChange(toggleRecipient(value, contact.id))}
                />
                <span className="flex-1 truncate text-sm">{contact.name}</span>
                <span className="text-[13px] text-(--mui-palette-text-secondary) tabular-nums">
                  {formatPhone(contact.phone)}
                </span>
              </label>
            </li>
          ))}
          {visible.length === 0 && (
            <li className="px-3 py-4 text-sm text-(--mui-palette-text-secondary)">Nenhum contato encontrado.</li>
          )}
        </ul>
      </div>

      {error ? (
        <Typography variant="body2" role="alert" className="flex items-center gap-1.5 text-(--mui-palette-error-dark)">
          <TriangleAlert size={14} />
          {error}
        </Typography>
      ) : (
        <div className="flex min-h-7 items-center gap-2">
          <Typography variant="body2" noWrap className="flex-1 text-(--mui-palette-grey-800)">
            {value.length > 0 ? summarizeRecipients(value, contacts) : 'Nenhum contato selecionado.'}
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
