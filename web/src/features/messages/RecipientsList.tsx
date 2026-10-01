import type { Contact, WithId } from '@broadcast/shared'
import { InputAdornment, TextField } from '@mui/material'
import { Search } from 'lucide-react'
import { useState } from 'react'
import { SquareCheckbox } from '../../components/SquareCheckbox'
import { formatPhone, plural } from '../../lib/format'
import { searchContacts } from '../contacts/searchContacts'
import { toggleRecipient, toggleRecipients } from './messages'

type Props = {
  contacts: WithId<Contact>[]
  value: string[]
  onChange: (contactIds: string[]) => void
}

const RULE = 'border-(--mui-palette-divider)'
const ROW =
  'flex cursor-pointer items-center gap-3 px-3 hover:bg-[color-mix(in_srgb,var(--mui-palette-text-primary)_6%,transparent)] max-md:px-4'

// Search, "select all" and the checkable rows. On desktop it is a bordered box with its own
// scroll; on phones it fills the screen and the rows grow to two lines.
export const RecipientsList = ({ contacts, value, onChange }: Props) => {
  const [search, setSearch] = useState('')

  const visible = searchContacts(contacts, search)
  const visibleIds = visible.map((contact) => contact.id)
  const selectedVisible = visibleIds.filter((id) => value.includes(id)).length
  const allVisibleSelected = visible.length > 0 && selectedVisible === visible.length

  return (
    <>
      <TextField
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        placeholder="Buscar contato"
        fullWidth
        className="max-md:px-4 max-md:py-3"
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

      <div className={`max-md:border-t md:border md:bg-(--mui-palette-background-paper) ${RULE}`}>
        <label className={`${ROW} h-11 border-b-2 text-sm font-semibold max-md:h-12 ${RULE}`}>
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
        <ul className="m-0 list-none p-0 md:max-h-[236px] md:overflow-auto">
          {visible.map((contact) => (
            <li key={contact.id} className={`border-b md:last:border-b-0 ${RULE}`}>
              <label className={`${ROW} min-h-10 max-md:min-h-14`}>
                <SquareCheckbox
                  checked={value.includes(contact.id)}
                  onChange={() => onChange(toggleRecipient(value, contact.id))}
                />
                <span className="flex min-w-0 flex-1 max-md:flex-col md:items-center md:gap-3">
                  <span className="flex-1 truncate text-sm max-md:text-[15px]">{contact.name}</span>
                  <span className="text-[13px] text-(--mui-palette-text-secondary) tabular-nums">
                    {formatPhone(contact.phone)}
                  </span>
                </span>
              </label>
            </li>
          ))}
          {visible.length === 0 && (
            <li className="px-3 py-4 text-sm text-(--mui-palette-text-secondary) max-md:px-4">
              Nenhum contato encontrado.
            </li>
          )}
        </ul>
      </div>
    </>
  )
}
