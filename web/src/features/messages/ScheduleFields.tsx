import { isInFuture, localDateTimeToMillis, PAST_SCHEDULE_MESSAGE, type MessageFormInput } from '@broadcast/shared'
import { TextField, Typography } from '@mui/material'
import { Clock, TriangleAlert } from 'lucide-react'
import { Controller, useWatch, type Control } from 'react-hook-form'
import { formatDuration, timeZoneName, toDateInput } from '../../lib/format'
import { useNow } from '../../lib/useNow'

// Checked on every render against the clock, not only on submit: a time that was valid when
// typed can become past while the form stays open.
export const ScheduleFields = ({ control }: { control: Control<MessageFormInput> }) => {
  const now = useNow()
  const [date, time] = useWatch({ control, name: ['date', 'time'] })

  const millis = localDateTimeToMillis(date, time)
  const filled = !Number.isNaN(millis)
  const past = filled && !isInFuture(millis, now)

  return (
    <>
      <div className="grid grid-cols-[1.4fr_1fr] gap-2">
        <Controller
          control={control}
          name="date"
          render={({ field: { ref, ...field } }) => (
            <TextField
              {...field}
              inputRef={ref}
              type="date"
              label="Data"
              error={past}
              slotProps={{ htmlInput: { min: toDateInput(now) } }}
            />
          )}
        />
        <Controller
          control={control}
          name="time"
          render={({ field: { ref, ...field }, fieldState }) => (
            <TextField
              {...field}
              inputRef={ref}
              type="time"
              label="Hora"
              error={past || Boolean(fieldState.error)}
            />
          )}
        />
      </div>
      {past ? (
        <Typography variant="body2" role="alert" className="flex items-center gap-1.5 text-(--mui-palette-error-dark)">
          <TriangleAlert size={14} />
          {PAST_SCHEDULE_MESSAGE}
        </Typography>
      ) : (
        <Typography variant="body2" color="text.secondary" className="flex items-center gap-1.5">
          <Clock size={14} />
          {filled
            ? `Será enviada em ${formatDuration(millis - now)} · ${timeZoneName()} (seu fuso)`
            : 'Informe a data e a hora do envio.'}
        </Typography>
      )}
    </>
  )
}
