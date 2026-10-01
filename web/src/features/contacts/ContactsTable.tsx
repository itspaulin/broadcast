import type { Contact, WithId } from '@broadcast/shared'
import { IconButton, Table, TableBody, TableCell, TableHead, TableRow } from '@mui/material'
import { Pencil, Trash2 } from 'lucide-react'
import { formatPhone } from '../../lib/format'

export type ContactActions = {
  onEdit: (contact: WithId<Contact>) => void
  onDelete: (contact: WithId<Contact>) => void
}

type Props = ContactActions & { contacts: WithId<Contact>[] }

// A table instead of cards: denser, and phones line up in tabular figures.
export const ContactsTable = ({ contacts, onEdit, onDelete }: Props) => (
  <Table>
    <TableHead>
      <TableRow>
        <TableCell>Nome</TableCell>
        <TableCell>Telefone</TableCell>
        <TableCell className="w-24" />
      </TableRow>
    </TableHead>
    <TableBody>
      {contacts.map((contact) => (
        <TableRow key={contact.id} hover>
          <TableCell className="font-semibold">{contact.name}</TableCell>
          <TableCell className="tabular-nums">{formatPhone(contact.phone)}</TableCell>
          <TableCell align="right" className="whitespace-nowrap">
            <IconButton aria-label={`Editar ${contact.name}`} onClick={() => onEdit(contact)}>
              <Pencil size={18} />
            </IconButton>
            <IconButton aria-label={`Excluir ${contact.name}`} onClick={() => onDelete(contact)}>
              <Trash2 size={18} />
            </IconButton>
          </TableCell>
        </TableRow>
      ))}
    </TableBody>
  </Table>
)
