import type { Connection, WithId } from '@broadcast/shared'
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Skeleton,
} from '@mui/material'
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import { callableErrorMessage } from '../../lib/callableErrors'
import { plural } from '../../lib/format'
import { useCurrentUser } from '../auth/authContext'
import { countConnectionData, deleteConnection } from './connectionsService'

type Counts = { contacts: number; messages: number }

const describeCounts = (counts: Counts | null) => {
  if (!counts) return 'Todos os contatos e mensagens desta conexão também serão excluídos.'
  if (counts.contacts + counts.messages === 0) return 'A conexão não tem contatos nem mensagens.'
  return `${plural(counts.contacts, 'contato', 'contatos')} e ${plural(counts.messages, 'mensagem', 'mensagens')} desta conexão também serão excluídos.`
}

type Props = {
  open: boolean
  connection?: WithId<Connection>
  onClose: () => void
}

export const DeleteConnectionDialog = ({ open, connection, onClose }: Props) => {
  const user = useCurrentUser()
  const navigate = useNavigate()
  const { connectionId: currentConnectionId } = useParams()
  const [counts, setCounts] = useState<{ connectionId: string; value: Counts | null } | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open || !connection) return
    let active = true
    countConnectionData(user.uid, connection.id)
      .then((value) => active && setCounts({ connectionId: connection.id, value }))
      .catch(() => active && setCounts({ connectionId: connection.id, value: null }))
    return () => {
      active = false
    }
  }, [open, connection, user.uid])

  // Counts from a previously opened connection are ignored until the new ones arrive.
  const loaded = connection && counts?.connectionId === connection.id ? counts : null

  const close = () => {
    setError(null)
    setCounts(null)
    onClose()
  }

  const confirm = async () => {
    if (!connection) return
    setDeleting(true)
    setError(null)
    try {
      await deleteConnection(connection.id)
      if (currentConnectionId === connection.id) navigate('/')
      close()
    } catch (caught) {
      setError(callableErrorMessage(caught, 'Não foi possível excluir a conexão. Tente novamente.'))
    } finally {
      setDeleting(false)
    }
  }

  return (
    <Dialog open={open} onClose={deleting ? undefined : close} fullWidth maxWidth="xs">
      <DialogTitle>Excluir “{connection?.name}”?</DialogTitle>
      <DialogContent className="flex flex-col gap-3">
        {error && <Alert severity="error">{error}</Alert>}
        {!loaded && <Skeleton />}
        {loaded && (
          <DialogContentText>
            {describeCounts(loaded.value)} Esta ação não pode ser desfeita.
          </DialogContentText>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={close} disabled={deleting}>
          Cancelar
        </Button>
        <Button color="error" variant="contained" onClick={confirm} loading={deleting} disabled={!loaded}>
          Excluir
        </Button>
      </DialogActions>
    </Dialog>
  )
}
