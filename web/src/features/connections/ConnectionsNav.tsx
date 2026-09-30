import type { Connection, WithId } from '@broadcast/shared'
import AddIcon from '@mui/icons-material/Add'
import EditIcon from '@mui/icons-material/Edit'
import {
  Alert,
  Button,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Skeleton,
  Typography,
} from '@mui/material'
import { useState } from 'react'
import { NavLink } from 'react-router'
import { useCurrentUser } from '../auth/authContext'
import { ConnectionDialog } from './ConnectionDialog'
import { useConnections } from './connectionsService'

type DialogState = { open: false } | { open: true; connection?: WithId<Connection> }

export const ConnectionsNav = ({ onNavigate }: { onNavigate?: () => void }) => {
  const user = useCurrentUser()
  const { data: connections, loading, error } = useConnections(user.uid)
  const [dialog, setDialog] = useState<DialogState>({ open: false })

  return (
    <nav aria-label="Conexões" className="flex flex-col gap-2 py-4">
      <div className="flex items-center justify-between px-4">
        <Typography variant="overline" color="text.secondary">
          Conexões
        </Typography>
        <Button size="small" startIcon={<AddIcon />} onClick={() => setDialog({ open: true })}>
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
                aria-label={`Renomear ${connection.name}`}
                onClick={() => setDialog({ open: true, connection })}
              >
                <EditIcon fontSize="small" />
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

      <ConnectionDialog
        open={dialog.open}
        connection={dialog.open ? dialog.connection : undefined}
        onClose={() => setDialog({ open: false })}
        onCreated={onNavigate}
      />
    </nav>
  )
}
