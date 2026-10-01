import { contactInputSchema, type Contact, type WithId } from '@broadcast/shared'
import { zodResolver } from '@hookform/resolvers/zod'
import { Alert, Button, Dialog, DialogActions, DialogContent, DialogTitle } from '@mui/material'
import { useForm } from 'react-hook-form'
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
    <Dialog open={open} onClose={close} fullWidth maxWidth="xs">
      <form onSubmit={onSubmit} noValidate>
        <DialogTitle>{contact ? 'Editar contato' : 'Novo contato'}</DialogTitle>
        <DialogContent className="flex flex-col gap-4">
          {formState.errors.root && <Alert severity="error">{formState.errors.root.message}</Alert>}
          <FormTextField control={control} name="name" label="Nome" autoFocus margin="dense" />
          <FormTextField
            control={control}
            name="phone"
            label="Telefone"
            type="tel"
            autoComplete="tel"
            placeholder="(11) 99999-9999"
            helperText="Com DDD. Apenas números do Brasil."
          />
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
