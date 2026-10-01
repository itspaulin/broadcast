import type { Contact, WithId } from '@broadcast/shared'
import { Divider, IconButton, List, ListItem, ListItemIcon, ListItemText, Menu, MenuItem } from '@mui/material'
import { EllipsisVertical, Pencil, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { formatPhone } from '../../lib/format'
import type { ContactActions } from './ContactsTable'

type Props = ContactActions & { contacts: WithId<Contact>[] }
type MenuState = { anchor: HTMLElement; contact: WithId<Contact> } | null

// On phones the row actions go into one 44px menu button instead of two small icons side
// by side: fewer wrong taps.
export const ContactsList = ({ contacts, onEdit, onDelete }: Props) => {
  const [menu, setMenu] = useState<MenuState>(null)

  const choose = (action: (contact: WithId<Contact>) => void) => {
    if (menu) action(menu.contact)
    setMenu(null)
  }

  return (
    <>
      <List disablePadding>
        {contacts.map((contact) => (
          <ListItem
            key={contact.id}
            divider
            className="min-h-16 py-1 pr-14 pl-4"
            secondaryAction={
              <IconButton
                edge="end"
                aria-label={`Ações de ${contact.name}`}
                className="size-11"
                onClick={(event) => setMenu({ anchor: event.currentTarget, contact })}
              >
                <EllipsisVertical size={18} />
              </IconButton>
            }
          >
            <ListItemText
              primary={contact.name}
              secondary={formatPhone(contact.phone)}
              slotProps={{
                primary: { noWrap: true, className: 'text-base font-semibold' },
                secondary: { className: 'text-sm tabular-nums' },
              }}
            />
          </ListItem>
        ))}
      </List>

      <Menu anchorEl={menu?.anchor} open={menu !== null} onClose={() => setMenu(null)}>
        <MenuItem onClick={() => choose(onEdit)}>
          <ListItemIcon>
            <Pencil size={16} />
          </ListItemIcon>
          Editar
        </MenuItem>
        <Divider />
        <MenuItem onClick={() => choose(onDelete)} className="text-(--mui-palette-error-main)">
          <ListItemIcon>
            <Trash2 size={16} />
          </ListItemIcon>
          Excluir…
        </MenuItem>
      </Menu>
    </>
  )
}
