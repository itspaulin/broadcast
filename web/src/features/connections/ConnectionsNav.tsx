import type { Connection, WithId } from '@broadcast/shared'
import AddIcon from '@mui/icons-material/Add'
import DeleteIcon from '@mui/icons-material/Delete'
import EditIcon from '@mui/icons-material/Edit'
import MoreVertIcon from '@mui/icons-material/MoreVert'
import {
  Alert,
  Button,
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
import { useState } from 'react'
import { NavLink } from 'react-router'
import { useCurrentUser } from '../auth/authContext'
import { ConnectionDialog } from './ConnectionDialog'
import { useConnections } from './connectionsService'
import { DeleteConnectionDialog } from './DeleteConnectionDialog'

// Dialogs keep their target after closing so the exit animation does not flash empty content.
type DialogState = { open: boolean; connection?: WithId<Connection> }
type MenuState = { anchor: HTMLElement; connection: WithId<Connection> } | null

export const ConnectionsNav = ({ onNavigate }: { onNavigate?: () => void }) => {
  const user = useCurrentUser()
  const { data: connections, loading, error } = useConnections(user.uid)
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
    <nav aria-label="Conexões" className="flex flex-col gap-2 py-4">
      <div className="flex items-center justify-between px-4">
        <Typography variant="overline" color="text.secondary">
          Conexões
        </Typography>
        <Button size="small" startIcon={<AddIcon />} onClick={() => setEditing({ open: true })}>
          Nova
        </Button>
      </div>

      {loading && (
        <div className="flex flex-col gap-1 px-4">
          <Skeleton height={40} />
          <Skeleton height={40} />
        </div>
      )}

      {error && (
        <Alert severity="error" className="mx-4">
          Não foi possível carregar as conexões.
        </Alert>
      )}

      {!loading && !error && connections.length === 0 && (
        <Typography variant="body2" color="text.secondary" className="px-4">
          Nenhuma conexão ainda. Crie a primeira para cadastrar contatos e enviar mensagens.
        </Typography>
      )}

      <List dense disablePadding>
        {connections.map((connection) => (
          <ListItem
            key={connection.id}
            disablePadding
            secondaryAction={
              <IconButton
                edge="end"
                size="small"
                aria-label={`Ações de ${connection.name}`}
                onClick={(event) => setMenu({ anchor: event.currentTarget, connection })}
              >
                <MoreVertIcon fontSize="small" />
              </IconButton>
            }
          >
            <ListItemButton
              component={NavLink}
              to={`/connections/${connection.id}`}
              onClick={onNavigate}
              className="aria-[current=page]:bg-blue-50 aria-[current=page]:text-blue-800"
            >
              <ListItemText primary={connection.name} slotProps={{ primary: { noWrap: true } }} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>

      <Menu anchorEl={menu?.anchor} open={menu !== null} onClose={() => setMenu(null)}>
        <MenuItem onClick={() => openFromMenu('edit')}>
          <ListItemIcon>
            <EditIcon fontSize="small" />
          </ListItemIcon>
          Renomear
        </MenuItem>
        <MenuItem onClick={() => openFromMenu('delete')} className="text-red-700">
          <ListItemIcon>
            <DeleteIcon fontSize="small" color="error" />
          </ListItemIcon>
          Excluir
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
