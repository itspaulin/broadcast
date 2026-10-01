import {
  localDateTimeToMillis,
  MESSAGE_BODY_MAX_LENGTH,
  messageFormSchema,
  type Message,
  type MessageFormInput,
  type WithId,
} from '@broadcast/shared'
import { zodResolver } from '@hookform/resolvers/zod'
import { Alert, Button, ToggleButton, ToggleButtonGroup, Typography } from '@mui/material'
import { Calendar, Check, LoaderCircle, Pencil, Send, TriangleAlert } from 'lucide-react'
import { Controller, useForm, useWatch } from 'react-hook-form'
import { FormTextField } from '../../components/FormTextField'
import { callableErrorMessage } from '../../lib/callableErrors'
import { capitalize, formatWhen, plural, toDateInput, toTimeInput } from '../../lib/format'
import { useConnectionContext } from '../connections/connectionContext'
import { createMessage, updateMessage } from './messagesService'
import { RecipientsPicker } from './RecipientsPicker'
import { ScheduleFields } from './ScheduleFields'

const HOUR_MS = 60 * 60 * 1000
const FIVE_MINUTES_MS = 5 * 60 * 1000
const COUNTER_WARNING_AT = 3900

const emptyForm: MessageFormInput = { contactIds: [], body: '', mode: 'now', date: '', time: '' }

const formOf = (message: Message): MessageFormInput => {
  const scheduledAt = message.scheduledAt?.toMillis() ?? Date.now()
  return {
    contactIds: message.contactIds,
    body: message.body,
    mode: 'schedule',
    date: toDateInput(scheduledAt),
    time: toTimeInput(scheduledAt),
  }
}

const SECTION = 'text-[13px] font-semibold'

type Props = {
  // 'screen' fills a full-screen dialog on phones: scrolling body and the action fixed at the bottom.
  layout: 'panel' | 'screen'
  // A scheduled message to edit; without it the composer creates a new one. The parent keys the
  // composer by this message, so switching between the two starts a fresh form.
  editing?: WithId<Message>
  onDone?: () => void
}

export const MessageComposer = ({ layout, editing, onDone }: Props) => {
  const screen = layout === 'screen'
  const { connection, contacts } = useConnectionContext()
  const { control, handleSubmit, setError, setValue, getValues, reset, formState } = useForm({
    resolver: zodResolver(messageFormSchema),
    defaultValues: editing ? formOf(editing) : emptyForm,
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
      const message = {
        contactIds: form.contactIds.filter((id) => existing.has(id)),
        body: form.body,
        scheduledAt: form.mode === 'schedule' ? localDateTimeToMillis(form.date, form.time) : null,
      }
      if (editing) await updateMessage({ messageId: editing.id, ...message })
      else await createMessage({ connectionId: connection.id, ...message })
      reset(emptyForm)
      onDone?.()
    } catch (error) {
      const fallback = editing
        ? 'Não foi possível salvar a mensagem. Tente novamente.'
        : 'Não foi possível enviar a mensagem. Tente novamente.'
      setError('root', { message: callableErrorMessage(error, fallback) })
    }
  })

  const submitting = formState.isSubmitting
  const title = editing ? 'Editar mensagem' : 'Nova mensagem'
  const action = mode === 'schedule' ? 'Agendar' : 'Enviar agora'
  const recipients = contactIds.length > 0 ? ` para ${plural(contactIds.length, 'contato', 'contatos')}` : ''

  return (
    <form
      noValidate
      onSubmit={onSubmit}
      aria-label={title}
      className={screen ? 'flex min-h-0 flex-1 flex-col' : 'flex flex-col gap-5'}
    >
      {!screen && (
        <Typography variant="h6" component="h2">
          {title}
        </Typography>
      )}

      <div className={screen ? 'flex flex-1 flex-col gap-5 overflow-auto p-4' : 'contents'}>
        {editing && (
          <div className="flex items-center gap-2.5 bg-(--mui-palette-text-primary) px-3 py-1.5 text-sm text-(--mui-palette-background-default)">
            <Pencil size={16} />
            <span className="flex-1">
              Editando mensagem agendada
              {editing.scheduledAt && ` · ${capitalize(formatWhen(editing.scheduledAt.toMillis()))}`}
            </span>
            <Button color="inherit" size="small" onClick={onDone}>
              Cancelar
            </Button>
          </div>
        )}
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
          {/* A scheduled message stays scheduled: editing changes when, not whether, it is sent. */}
          {!editing && (
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
          )}
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
          endIcon={
            submitting ? <LoaderCircle size={18} className="animate-spin" /> : editing ? <Check size={18} /> : <Send size={18} />
          }
        >
          {editing ? (submitting ? 'Salvando…' : 'Salvar alterações') : submitting ? 'Enviando…' : `${action}${recipients}`}
        </Button>
      </div>
    </form>
  )
}
