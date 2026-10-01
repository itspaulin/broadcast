import { connectionInputSchema, type Connection, type WithId } from '@broadcast/shared'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router'
import { FormDialog } from '../../components/FormDialog'
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
    <FormDialog
      open={open}
      title={connection ? 'Renomear conexão' : 'Nova conexão'}
      submitLabel={connection ? 'Salvar nome' : 'Criar conexão'}
      submitting={formState.isSubmitting}
      error={formState.errors.root?.message}
      onSubmit={onSubmit}
      onClose={close}
    >
      <FormTextField
        control={control}
        name="name"
        label="Nome da conexão"
        autoFocus
        helperText='Ex.: o nome da unidade ou do canal, como "Delivery".'
      />
    </FormDialog>
  )
}
