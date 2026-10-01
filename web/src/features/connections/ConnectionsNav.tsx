import type { Connection, WithId } from '@broadcast/shared'
import {
  Alert,
  Button,
  Divider,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Skeleton,
  Typography,
} from '@mui/material'
import { EllipsisVertical, Pencil, Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { NavLink, useParams } from 'react-router'
import { ConnectionDialog } from './ConnectionDialog'
import { DeleteConnectionDialog } from './DeleteConnectionDialog'

// Dialogs keep their target after closing so the exit animation does not flash empty content.
type DialogState = { open: boolean; connection?: WithId<Connection> }
type MenuState = { anchor: HTMLElement; connection: WithId<Connection> } | null

type Props = {
  connections: { data: WithId<Connection>[]; loading: boolean; error: Error | null }
  onNavigate?: () => void
}

const RULE = 'border-(--mui-palette-divider)'
// The open connection is the context for everything on the right, so it gets the strongest
// state (solid ink); red stays reserved for actions.
const OPEN = 'bg-(--mui-palette-text-primary) text-(--mui-palette-background-default)'

export const ConnectionsNav = ({ connections: { data: connections, loading, error }, onNavigate }: Props) => {
  const { connectionId } = useParams()
  const [menu, setMenu] = useState<MenuState>(null)
  const [editing, setEditing] = useState<DialogState>({ open: false })
  const [deleting, setDeleting] = useState<DialogState>({ open: false })

  const openFromMenu = (action: 'edit' | 'delete') => {
    if (!menu) return
    if (action === 'edit') setEditing({ open: true, connection: menu.connection })
    else setDeleting({ open: true, connection: menu.connection })
    setMenu(null)
  }

  return (
    <nav aria-label="Conexões" className="flex flex-col">
      <div className="flex items-center justify-between py-3 pr-3 pl-5 md:pt-5 md:pr-4 md:pl-6">
        <Typography variant="overline" color="text.secondary">
          Conexões
        </Typography>
        <Button startIcon={<Plus size={16} />} onClick={() => setEditing({ open: true })}>
          Nova conexão
        </Button>
      </div>

      {loading && (
        <div className="flex flex-col gap-2 px-5 md:px-6">
          <Skeleton height={32} />
          <Skeleton height={32} />
        </div>
      )}

      {error && (
        <Alert severity="error" className="mx-4">
          Não foi possível carregar as conexões.
        </Alert>
      )}

      {!loading && !error && connections.length === 0 && (
        <Typography variant="body2" color="text.secondary" className="px-5 md:px-6">
          Nenhuma conexão ainda.
        </Typography>
      )}

      {connections.length > 0 && (
        <List disablePadding className={`border-t ${RULE}`}>
          {connections.map((connection) => {
            const isOpen = connection.id === connectionId
            return (
              <ListItem
                key={connection.id}
                disablePadding
                className={isOpen ? OPEN : `border-b ${RULE}`}
                secondaryAction={
                  <IconButton
                    edge="end"
                    aria-label={`Ações de ${connection.name}`}
                    className="max-md:size-11"
                    onClick={(event) => setMenu({ anchor: event.currentTarget, connection })}
                  >
                    <EllipsisVertical size={18} />
                  </IconButton>
                }
              >
                <ListItemButton
                  component={NavLink}
                  to={`/connections/${connection.id}`}
                  onClick={onNavigate}
                  className="h-13 py-0 pr-12 pl-5 md:h-12 md:pl-6"
                >
                  <ListItemText
                    primary={connection.name}
                    slotProps={{ primary: { noWrap: true, className: isOpen ? 'font-semibold' : '' } }}
                  />
                </ListItemButton>
              </ListItem>
            )
          })}
        </List>
      )}

      <Menu anchorEl={menu?.anchor} open={menu !== null} onClose={() => setMenu(null)}>
        <MenuItem onClick={() => openFromMenu('edit')}>
          <ListItemIcon>
            <Pencil size={16} />
          </ListItemIcon>
          Renomear
        </MenuItem>
        <Divider />
        {/* The ellipsis signals that this opens a confirmation instead of deleting right away. */}
        <MenuItem onClick={() => openFromMenu('delete')} className="text-(--mui-palette-error-main)">
          <ListItemIcon>
            <Trash2 size={16} />
          </ListItemIcon>
          Excluir…
        </MenuItem>
      </Menu>

      <ConnectionDialog
        open={editing.open}
        connection={editing.connection}
        onClose={() => setEditing((current) => ({ ...current, open: false }))}
        onCreated={onNavigate}
      />
      <DeleteConnectionDialog
        open={deleting.open}
        connection={deleting.connection}
        onClose={() => setDeleting((current) => ({ ...current, open: false }))}
      />
    </nav>
  )
}
