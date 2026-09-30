import type { Contact, WithId } from '@broadcast/shared'
import { ConfirmDeleteDialog } from '../../components/ConfirmDeleteDialog'
import { callableErrorMessage } from '../../lib/callableErrors'
import { plural } from '../../lib/format'
import { useCurrentUser } from '../auth/authContext'
import { deleteContact, findScheduledMessagesWith } from './contactsService'

const describeImpact = (recipientCounts: number[]) => {
  if (recipientCounts.length === 0) return 'Nenhuma mensagem agendada será alterada.'
  const emptied = recipientCounts.filter((count) => count === 1).length
  const removal = `O contato será removido de ${plural(recipientCounts.length, 'mensagem agendada', 'mensagens agendadas')}.`
  if (emptied === 0) return removal
  return `${removal} ${
    emptied === 1
      ? '1 delas ficará sem destinatários e será excluída.'
      : `${emptied} delas ficarão sem destinatários e serão excluídas.`
  }`
}

type Props = {
  open: boolean
  contact?: WithId<Contact>
  onClose: () => void
}

export const DeleteContactDialog = ({ open, contact, onClose }: Props) => {
  const user = useCurrentUser()

  if (!contact) return null

  return (
    <ConfirmDeleteDialog
      open={open}
      title={`Excluir “${contact.name}”?`}
      describe={() =>
        findScheduledMessagesWith(user.uid, contact.id).then(
          (messages) => describeImpact(messages.map((message) => message.contactIds.length)),
          () => 'O contato será removido das mensagens agendadas; as que ficarem sem destinatários serão excluídas.',
        )
      }
      onConfirm={async () => {
        await deleteContact(contact.id)
      }}
      errorMessage={(error) => callableErrorMessage(error, 'Não foi possível excluir o contato. Tente novamente.')}
      onClose={onClose}
    />
  )
}
