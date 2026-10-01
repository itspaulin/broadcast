import {
  localDateTimeToMillis,
  MESSAGE_BODY_MAX_LENGTH,
  messageFormSchema,
  type MessageFormInput,
} from '@broadcast/shared'
import { zodResolver } from '@hookform/resolvers/zod'
import { Alert, Button, ToggleButton, ToggleButtonGroup, Typography } from '@mui/material'
import { Calendar, LoaderCircle, Send, TriangleAlert } from 'lucide-react'
import { Controller, useForm, useWatch } from 'react-hook-form'
import { FormTextField } from '../../components/FormTextField'
import { callableErrorMessage } from '../../lib/callableErrors'
import { plural, toDateInput, toTimeInput } from '../../lib/format'
import { useConnectionContext } from '../connections/connectionContext'
import { createMessage } from './messagesService'
import { RecipientsPicker } from './RecipientsPicker'
import { ScheduleFields } from './ScheduleFields'

const HOUR_MS = 60 * 60 * 1000
const FIVE_MINUTES_MS = 5 * 60 * 1000
const COUNTER_WARNING_AT = 3900

const emptyForm: MessageFormInput = { contactIds: [], body: '', mode: 'now', date: '', time: '' }

const SECTION = 'text-[13px] font-semibold'

type Props = {
  // 'screen' fills a full-screen dialog on phones: scrolling body and the action fixed at the bottom.
  layout: 'panel' | 'screen'
  onSent?: () => void
}

export const MessageComposer = ({ layout, onSent }: Props) => {
  const screen = layout === 'screen'
  const { connection, contacts } = useConnectionContext()
  const { control, handleSubmit, setError, setValue, getValues, reset, formState } = useForm({
    resolver: zodResolver(messageFormSchema),
    defaultValues: emptyForm,
  })
  const [selected, body, mode] = useWatch({ control, name: ['contactIds', 'body', 'mode'] })

  // A contact deleted while selected leaves the list, so it must leave the selection too.
  const existing = new Set(contacts.data.map((contact) => contact.id))
  const contactIds = selected.filter((id) => existing.has(id))

  const changeMode = (next: MessageFormInput['mode']) => {
    setValue('mode', next)
    if (next === 'schedule' && !getValues('date')) {
      // Rounded up to the next five minutes: the inputs have no seconds, and "14:35" reads
      // better than "14:32".
      const suggested = Math.ceil((Date.now() + HOUR_MS) / FIVE_MINUTES_MS) * FIVE_MINUTES_MS
      setValue('date', toDateInput(suggested))
      setValue('time', toTimeInput(suggested))
    }
  }

  const onSubmit = handleSubmit(async (form) => {
    try {
      await createMessage({
        connectionId: connection.id,
        contactIds: form.contactIds.filter((id) => existing.has(id)),
        body: form.body,
        scheduledAt: form.mode === 'schedule' ? localDateTimeToMillis(form.date, form.time) : null,
      })
      reset(emptyForm)
      onSent?.()
    } catch (error) {
      setError('root', { message: callableErrorMessage(error, 'Não foi possível enviar a mensagem. Tente novamente.') })
    }
  })

  const submitting = formState.isSubmitting
  const action = mode === 'schedule' ? 'Agendar' : 'Enviar agora'
  const recipients = contactIds.length > 0 ? ` para ${plural(contactIds.length, 'contato', 'contatos')}` : ''

  return (
    <form
      noValidate
      onSubmit={onSubmit}
      aria-label="Nova mensagem"
      className={screen ? 'flex min-h-0 flex-1 flex-col' : 'flex flex-col gap-5'}
    >
      {!screen && (
        <Typography variant="h6" component="h2">
          Nova mensagem
        </Typography>
      )}

      <div className={screen ? 'flex flex-1 flex-col gap-5 overflow-auto p-4' : 'contents'}>
        <Controller
          control={control}
          name="contactIds"
          render={({ field, fieldState }) => (
            <RecipientsPicker
              contacts={contacts.data}
              value={contactIds}
              onChange={field.onChange}
              error={fieldState.error?.message}
              compact={screen}
            />
          )}
        />

        <div className="flex flex-col gap-2">
          <label htmlFor="message-body" className={SECTION}>
            2 · Mensagem
          </label>
          <FormTextField
            control={control}
            name="body"
            id="message-body"
            multiline
            minRows={5}
            placeholder="Escreva o que seus clientes vão receber"
            slotProps={{ htmlInput: { maxLength: MESSAGE_BODY_MAX_LENGTH } }}
            helperText={
              <span className="flex justify-between">
                Quebras de linha são mantidas.
                <span
                  className={`tabular-nums ${body.length > COUNTER_WARNING_AT ? 'text-(--mui-palette-error-main)' : ''}`}
                >
                  {body.length.toLocaleString('pt-BR')} / {MESSAGE_BODY_MAX_LENGTH.toLocaleString('pt-BR')}
                </span>
              </span>
            }
          />
        </div>

        <div className="flex flex-col gap-2.5">
          <span id="message-when" className={SECTION}>
            3 · Quando enviar
          </span>
          <ToggleButtonGroup
            exclusive
            value={mode}
            onChange={(_, next: MessageFormInput['mode'] | null) => next && changeMode(next)}
            aria-labelledby="message-when"
            className="grid grid-cols-2"
          >
            <ToggleButton value="now" className="min-h-11 justify-start gap-2 text-sm">
              <Send size={16} />
              Enviar agora
            </ToggleButton>
            <ToggleButton value="schedule" className="min-h-11 justify-start gap-2 text-sm">
              <Calendar size={16} />
              Agendar
            </ToggleButton>
          </ToggleButtonGroup>
          {mode === 'schedule' && <ScheduleFields control={control} />}
        </div>
      </div>

      <div className={screen ? 'flex flex-none flex-col gap-3 border-t-2 border-(--mui-palette-divider) p-4' : 'contents'}>
        {formState.errors.root && (
          <Alert severity="error" icon={<TriangleAlert size={20} />}>
            {formState.errors.root.message}
          </Alert>
        )}

        <Button
          type="submit"
          variant="contained"
          size="large"
          disabled={submitting}
          className="min-h-12 text-[15px]"
          endIcon={submitting ? <LoaderCircle size={18} className="animate-spin" /> : <Send size={18} />}
        >
          {submitting ? 'Enviando…' : `${action}${recipients}`}
        </Button>
      </div>
    </form>
  )
}
