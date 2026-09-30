import type { Connection, WithId } from '@broadcast/shared'
import { useNavigate, useParams } from 'react-router'
import { ConfirmDeleteDialog } from '../../components/ConfirmDeleteDialog'
import { callableErrorMessage } from '../../lib/callableErrors'
import { plural } from '../../lib/format'
import { useCurrentUser } from '../auth/authContext'
import { countConnectionData, deleteConnection } from './connectionsService'

const describeCounts = ({ contacts, messages }: { contacts: number; messages: number }) =>
  contacts + messages === 0
    ? 'A conexão não tem contatos nem mensagens.'
    : `${plural(contacts, 'contato', 'contatos')} e ${plural(messages, 'mensagem', 'mensagens')} desta conexão também serão excluídos.`

type Props = {
  open: boolean
  connection?: WithId<Connection>
  onClose: () => void
}

export const DeleteConnectionDialog = ({ open, connection, onClose }: Props) => {
  const user = useCurrentUser()
  const navigate = useNavigate()
  const { connectionId: currentConnectionId } = useParams()

  if (!connection) return null

  return (
    <ConfirmDeleteDialog
      open={open}
      title={`Excluir “${connection.name}”?`}
      describe={() =>
        countConnectionData(user.uid, connection.id).then(
          describeCounts,
          () => 'Todos os contatos e mensagens desta conexão também serão excluídos.',
        )
      }
      onConfirm={async () => {
        await deleteConnection(connection.id)
        if (currentConnectionId === connection.id) navigate('/')
      }}
      errorMessage={(error) => callableErrorMessage(error, 'Não foi possível excluir a conexão. Tente novamente.')}
      onClose={onClose}
    />
  )
}
