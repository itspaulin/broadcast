import { connectionInputSchema, type Connection, type WithId } from '@broadcast/shared'
import { zodResolver } from '@hookform/resolvers/zod'
import { Alert, Button, Dialog, DialogActions, DialogContent, DialogTitle } from '@mui/material'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router'
import { FormTextField } from '../../components/FormTextField'
import { useCurrentUser } from '../auth/authContext'
import { createConnection, renameConnection } from './connectionsService'

type Props = {
  open: boolean
  onClose: () => void
  connection?: WithId<Connection>
  onCreated?: () => void
}

export const ConnectionDialog = ({ open, onClose, connection, onCreated }: Props) => {
  const user = useCurrentUser()
  const navigate = useNavigate()
  const { control, handleSubmit, setError, formState, reset } = useForm({
    resolver: zodResolver(connectionInputSchema),
    values: { name: connection?.name ?? '' },
  })

  const close = () => {
    reset()
    onClose()
  }

  const onSubmit = handleSubmit(async (values) => {
    try {
      if (connection) {
        await renameConnection(connection.id, values)
      } else {
        const created = await createConnection(user.uid, values)
        navigate(`/connections/${created.id}`)
        onCreated?.()
      }
      close()
    } catch {
      setError('root', { message: 'Não foi possível salvar a conexão. Tente novamente.' })
    }
  })

  return (
    <Dialog open={open} onClose={close} fullWidth maxWidth="xs">
      <form onSubmit={onSubmit} noValidate>
        <DialogTitle>{connection ? 'Renomear conexão' : 'Nova conexão'}</DialogTitle>
        <DialogContent className="flex flex-col gap-4">
          {formState.errors.root && <Alert severity="error">{formState.errors.root.message}</Alert>}
          <FormTextField control={control} name="name" label="Nome" autoFocus margin="dense" />
        </DialogContent>
        <DialogActions>
          <Button onClick={close}>Cancelar</Button>
          <Button type="submit" variant="contained" loading={formState.isSubmitting}>
            Salvar
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  )
}
