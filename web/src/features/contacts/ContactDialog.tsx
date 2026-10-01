import { contactInputSchema, type Contact, type WithId } from '@broadcast/shared'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { FormDialog } from '../../components/FormDialog'
import { FormTextField } from '../../components/FormTextField'
import { formatPhone } from '../../lib/format'
import { useCurrentUser } from '../auth/authContext'
import { useConnectionContext } from '../connections/connectionContext'
import { createContact, updateContact } from './contactsService'

type Props = {
  open: boolean
  onClose: () => void
  contact?: WithId<Contact>
  // Prefills the name when creating from a search that found nothing.
  initialName?: string
}

export const ContactDialog = ({ open, onClose, contact, initialName = '' }: Props) => {
  const user = useCurrentUser()
  const { connection } = useConnectionContext()
  const { control, handleSubmit, setError, formState, reset } = useForm({
    resolver: zodResolver(contactInputSchema),
    values: { name: contact?.name ?? initialName, phone: contact ? formatPhone(contact.phone) : '' },
    mode: 'onTouched',
  })

  const close = () => {
    reset()
    onClose()
  }

  const onSubmit = handleSubmit(async (values) => {
    try {
      if (contact) await updateContact(contact.id, values)
      else await createContact(user.uid, connection.id, values)
      close()
    } catch {
      setError('root', { message: 'Não foi possível salvar o contato. Tente novamente.' })
    }
  })

  return (
    <FormDialog
      open={open}
      title={contact ? 'Editar contato' : 'Novo contato'}
      submitLabel="Salvar contato"
      submitting={formState.isSubmitting}
      error={formState.errors.root?.message}
      onSubmit={onSubmit}
      onClose={close}
    >
      <FormTextField control={control} name="name" label="Nome" autoFocus />
      <FormTextField
        control={control}
        name="phone"
        label="Telefone"
        type="tel"
        autoComplete="tel"
        placeholder="(11) 99999-9999"
        helperText="Com DDD, apenas números do Brasil. Pode digitar com ou sem máscara."
      />
    </FormDialog>
  )
}
