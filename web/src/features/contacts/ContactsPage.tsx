import type { Contact, WithId } from '@broadcast/shared'
import { Button, InputAdornment, Skeleton, TextField, Typography, useMediaQuery, useTheme } from '@mui/material'
import { Plus, Search, UserPlus } from 'lucide-react'
import { useState } from 'react'
import { EmptyState } from '../../components/EmptyState'
import { LoadError } from '../../components/LoadError'
import { plural } from '../../lib/format'
import { useConnectionContext } from '../connections/connectionContext'
import { ContactDialog } from './ContactDialog'
import { ContactsList } from './ContactsList'
import { ContactsTable } from './ContactsTable'
import { DeleteContactDialog } from './DeleteContactDialog'
import { searchContacts } from './searchContacts'

// Dialogs keep their target after closing so the exit animation does not flash empty content.
type EditState = { open: boolean; contact?: WithId<Contact>; initialName?: string }
type DeleteState = { open: boolean; contact?: WithId<Contact> }

const RULE = 'border-(--mui-palette-divider)'

export const ContactsPage = () => {
  const { connection, contacts } = useConnectionContext()
  const isDesktop = useMediaQuery(useTheme().breakpoints.up('md'))
  const [search, setSearch] = useState('')
  const [editing, setEditing] = useState<EditState>({ open: false })
  const [deleting, setDeleting] = useState<DeleteState>({ open: false })

  const visible = searchContacts(contacts.data, search)
  const hasContacts = contacts.data.length > 0
  const actions = {
    onEdit: (contact: WithId<Contact>) => setEditing({ open: true, contact }),
    onDelete: (contact: WithId<Contact>) => setDeleting({ open: true, contact }),
  }
  const create = (initialName?: string) => setEditing({ open: true, initialName })

  return (
    <section aria-label="Contatos" className="flex max-w-[1064px] flex-col md:gap-4 md:px-8 md:py-6">
      {hasContacts && (
        <div className={`flex items-center gap-4 max-md:border-b max-md:px-4 max-md:py-3 ${RULE}`}>
          <TextField
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar por nome ou telefone"
            className="w-full md:w-[360px]"
            slotProps={{
              htmlInput: { 'aria-label': 'Buscar por nome ou telefone' },
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <Search size={18} />
                  </InputAdornment>
                ),
              },
            }}
          />
          <Typography variant="body2" color="text.secondary" className="mr-auto text-sm max-md:hidden">
            {search.trim()
              ? `${visible.length} de ${plural(contacts.data.length, 'contato', 'contatos')}`
              : plural(contacts.data.length, 'contato', 'contatos')}
          </Typography>
          {isDesktop && (
            <Button variant="contained" size="large" startIcon={<Plus size={18} />} onClick={() => create()}>
              Novo contato
            </Button>
          )}
        </div>
      )}

      {contacts.loading && (
        <div className={`border-t-2 max-md:mx-4 ${RULE}`} aria-label="Carregando contatos" role="status">
          {[0, 1, 2, 3].map((row) => (
            <div key={row} className={`flex h-12 items-center gap-6 border-b ${RULE}`}>
              <Skeleton width={160} height={12} />
              <Skeleton width={110} height={12} />
            </div>
          ))}
        </div>
      )}

      {contacts.error && (
        <div className="max-md:p-4">
          <LoadError
            title="Não foi possível carregar os contatos."
            hint="Verifique sua internet. Nada foi perdido."
            onRetry={contacts.retry}
          />
        </div>
      )}

      {!contacts.loading && !contacts.error && !hasContacts && (
        <div className="max-md:px-4">
          <EmptyState
            icon={<UserPlus size={32} strokeWidth={1.75} />}
            title={`Nenhum contato em ${connection.name}`}
            description="Adicione quem deve receber suas mensagens. Basta nome e telefone com DDD."
            action={
              <Button variant="contained" size="large" startIcon={<Plus size={18} />} onClick={() => create()}>
                Adicionar primeiro contato
              </Button>
            }
          />
        </div>
      )}

      {hasContacts && visible.length === 0 && (
        <div className="flex flex-col items-start gap-3.5 max-md:p-4">
          <Typography>Nenhum contato encontrado para "{search.trim()}".</Typography>
          <div className="flex flex-wrap gap-2">
            <Button variant="outlined" color="inherit" onClick={() => setSearch('')}>
              Limpar busca
            </Button>
            <Button startIcon={<Plus size={16} />} onClick={() => create(search.trim())}>
              Criar "{search.trim()}"
            </Button>
          </div>
        </div>
      )}

      {visible.length > 0 &&
        (isDesktop ? (
          <ContactsTable contacts={visible} {...actions} />
        ) : (
          <ContactsList contacts={visible} {...actions} />
        ))}

      {!isDesktop && hasContacts && (
        // Leaves room for the fixed action below the last row.
        <div className="h-24">
          <div className="fixed inset-x-4 bottom-5">
            <Button
              variant="contained"
              fullWidth
              startIcon={<Plus size={18} />}
              onClick={() => create()}
              className="min-h-13 justify-center text-base shadow-[0_3px_10px_rgba(45,43,43,0.16)]"
            >
              Novo contato
            </Button>
          </div>
        </div>
      )}

      <ContactDialog
        open={editing.open}
        contact={editing.contact}
        initialName={editing.initialName}
        onClose={() => setEditing((current) => ({ ...current, open: false }))}
      />
      <DeleteContactDialog
        open={deleting.open}
        contact={deleting.contact}
        onClose={() => setDeleting((current) => ({ ...current, open: false }))}
      />
    </section>
  )
}
