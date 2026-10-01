import { messageBodyFormSchema, MESSAGE_BODY_MAX_LENGTH, type Message, type WithId } from '@broadcast/shared'
import { zodResolver } from '@hookform/resolvers/zod'
import { Typography } from '@mui/material'
import { useForm } from 'react-hook-form'
import { FormDialog } from '../../components/FormDialog'
import { FormTextField } from '../../components/FormTextField'
import { callableErrorMessage } from '../../lib/callableErrors'
import { updateMessage } from './messagesService'

type Props = {
  open: boolean
  message?: WithId<Message>
  onClose: () => void
}

export const EditSentMessageDialog = ({ open, message, onClose }: Props) => {
  const { control, handleSubmit, setError, formState, reset } = useForm({
    resolver: zodResolver(messageBodyFormSchema),
    values: { body: message?.body ?? '' },
  })

  const close = () => {
    reset()
    onClose()
  }

  const onSubmit = handleSubmit(async ({ body }) => {
    if (!message) return
    try {
      await updateMessage({ messageId: message.id, body })
      close()
    } catch (error) {
      setError('root', { message: callableErrorMessage(error, 'Não foi possível salvar o texto. Tente novamente.') })
    }
  })

  return (
    <FormDialog
      open={open}
      title="Editar texto enviado"
      submitLabel="Salvar texto"
      submitting={formState.isSubmitting}
      error={formState.errors.root?.message}
      onSubmit={onSubmit}
      onClose={close}
    >
      <FormTextField
        control={control}
        name="body"
        multiline
        minRows={5}
        autoFocus
        slotProps={{ htmlInput: { 'aria-label': 'Texto da mensagem', maxLength: MESSAGE_BODY_MAX_LENGTH } }}
      />
      <Typography variant="body2" className="text-(--mui-palette-grey-800)">
        Só o texto pode mudar. Os destinatários verão a mensagem com a etiqueta <i>editado</i>. Depois de 15 min
        do envio, não dá mais para editar.
      </Typography>
    </FormDialog>
  )
}
