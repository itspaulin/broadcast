import type { Connection, WithId } from '@broadcast/shared'
import { Typography } from '@mui/material'
import { useNavigate, useParams } from 'react-router'
import { ConfirmDeleteDialog } from '../../components/ConfirmDeleteDialog'
import { callableErrorMessage } from '../../lib/callableErrors'
import { plural } from '../../lib/format'
import { useCurrentUser } from '../auth/authContext'
import { countConnectionData, deleteConnection, type ConnectionImpact } from './connectionsService'

const IRREVERSIBLE = 'Esta ação não pode ser desfeita.'
const ROW = 'flex justify-between border-b border-(--mui-palette-divider) py-2 text-sm'

const describeImpact = ({ contacts, messages, scheduled }: ConnectionImpact) => {
  if (contacts + messages === 0) {
    return <Typography>A conexão não tem contatos nem mensagens. {IRREVERSIBLE}</Typography>
  }

  const parts = [
    contacts > 0 && plural(contacts, 'contato', 'contatos'),
    messages > 0 && plural(messages, 'mensagem', 'mensagens'),
  ].filter(Boolean)
  const onlyOne = contacts + messages === 1
  const verb = onlyOne ? (contacts === 1 ? 'também será excluído' : 'também será excluída') : 'também serão excluídos'
  const scheduledNote =
    scheduled === 0
      ? ''
      : ` (${scheduled === 1 ? '1 agendada, que não será enviada' : `${scheduled} agendadas, que não serão enviadas`})`

  return (
    <>
      <Typography>
        <strong className="font-semibold">{parts.join(' e ')}</strong> desta conexão {verb}. {IRREVERSIBLE}
      </Typography>
      <div className="border-t border-(--mui-palette-divider)">
        <div className={ROW}>
          <span>Contatos</span>
          <strong className="font-semibold">{contacts}</strong>
        </div>
        <div className={ROW}>
          <span>Mensagens{scheduledNote}</span>
          <strong className="font-semibold">{messages}</strong>
        </div>
      </div>
    </>
  )
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

  if (!connection) return null

  return (
    <ConfirmDeleteDialog
      open={open}
      title={`Excluir "${connection.name}"?`}
      confirmLabel="Excluir conexão"
      loadingHint="Verificando contatos e mensagens desta conexão…"
      describe={() =>
        countConnectionData(user.uid, connection.id).then(describeImpact, () => (
          <Typography>
            Todos os contatos e mensagens desta conexão também serão excluídos. {IRREVERSIBLE}
          </Typography>
        ))
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
