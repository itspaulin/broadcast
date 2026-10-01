import { ToggleButton, ToggleButtonGroup } from '@mui/material'
import type { MessageFilter } from './messages'

const OPTIONS: { value: MessageFilter; label: string }[] = [
  { value: 'all', label: 'Todas' },
  { value: 'scheduled', label: 'Agendadas' },
  { value: 'sent', label: 'Enviadas' },
]

type Props = {
  value: MessageFilter
  counts: Record<MessageFilter, number>
  onChange: (filter: MessageFilter) => void
}

export const MessagesFilter = ({ value, counts, onChange }: Props) => (
  <ToggleButtonGroup
    exclusive
    value={value}
    // MUI sends null when the selected option is clicked again; one filter always stays on.
    onChange={(_, next: MessageFilter | null) => next && onChange(next)}
    aria-label="Filtrar mensagens"
    className="max-md:grid max-md:w-full max-md:grid-cols-3"
  >
    {OPTIONS.map((option) => (
      <ToggleButton key={option.value} value={option.value}>
        {option.label} · {counts[option.value]}
      </ToggleButton>
    ))}
  </ToggleButtonGroup>
)
