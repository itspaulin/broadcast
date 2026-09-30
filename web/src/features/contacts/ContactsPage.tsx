import type { Contact, WithId } from '@broadcast/shared'
import AddIcon from '@mui/icons-material/Add'
import DeleteIcon from '@mui/icons-material/Delete'
import EditIcon from '@mui/icons-material/Edit'
import {
  Alert,
  Button,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Paper,
  Skeleton,
  Typography,
} from '@mui/material'
import { useState } from 'react'
import { formatPhone, plural } from '../../lib/format'
import { useCurrentUser } from '../auth/authContext'
import { useConnection } from '../connections/connectionContext'
import { ContactDialog } from './ContactDialog'
import { DeleteContactDialog } from './DeleteContactDialog'
import { useContacts } from './contactsService'

type DialogState = { open: boolean; contact?: WithId<Contact> }

export const ContactsPage = () => {
  const user = useCurrentUser()
  const connection = useConnection()
  const { data: contacts, loading, error } = useContacts(user.uid, connection.id)
  const [editing, setEditing] = useState<DialogState>({ open: false })
  const [deleting, setDeleting] = useState<DialogState>({ open: false })

  return (
    <section aria-label="Contatos" className="flex max-w-3xl flex-col gap-4">
      <div className="flex items-center justify-between gap-2">
        <Typography variant="body2" color="text.secondary">
          {loading ? ' ' : plural(contacts.length, 'contato', 'contatos')}
        </Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setEditing({ open: true })}>
          Novo contato
        </Button>
      </div>

      {error && <Alert severity="error">Não foi possível carregar os contatos.</Alert>}

      {loading && (
        <div className="flex flex-col gap-1">
          <Skeleton height={56} />
          <Skeleton height={56} />
          <Skeleton height={56} />
        </div>
      )}

      {!loading && !error && contacts.length === 0 && (
        <Paper variant="outlined" className="flex flex-col items-center gap-2 p-8 text-center">
          <Typography>Nenhum contato nesta conexão.</Typography>
          <Typography variant="body2" color="text.secondary">
            Adicione contatos para enviar mensagens a eles pelo Broadcast.
          </Typography>
        </Paper>
      )}

      {contacts.length > 0 && (
        <Paper variant="outlined">
          <List disablePadding>
            {contacts.map((contact, index) => (
              <ListItem
                key={contact.id}
                divider={index < contacts.length - 1}
                className="pr-28"
                secondaryAction={
                  <div className="flex gap-1">
                    <IconButton
                      aria-label={`Editar ${contact.name}`}
                      onClick={() => setEditing({ open: true, contact })}
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton
                      edge="end"
                      aria-label={`Excluir ${contact.name}`}
                      onClick={() => setDeleting({ open: true, contact })}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </div>
                }
              >
                <ListItemText primary={contact.name} secondary={formatPhone(contact.phone)} />
              </ListItem>
            ))}
          </List>
        </Paper>
      )}

      <ContactDialog
        open={editing.open}
        contact={editing.contact}
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
