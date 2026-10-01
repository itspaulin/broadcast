import type { Contact, WithId } from '@broadcast/shared'
import { Button } from '@mui/material'
import { ArrowLeft, Check } from 'lucide-react'
import { useState } from 'react'
import { FullScreenDialog } from '../../components/FullScreenDialog'
import { plural } from '../../lib/format'
import { RecipientsList } from './RecipientsList'

type Props = {
  contacts: WithId<Contact>[]
  value: string[]
  onConfirm: (contactIds: string[]) => void
  onClose: () => void
}

// The selection here is a draft: going back discards it, confirming applies it. The parent
// mounts this screen only while it is open, so the draft always starts from the current selection.
export const RecipientsScreen = ({ contacts, value, onConfirm, onClose }: Props) => {
  const [draft, setDraft] = useState(value)

  return (
    <FullScreenDialog
      open
      title="Destinatários"
      closeIcon={<ArrowLeft size={22} />}
      closeLabel="Voltar sem alterar"
      onClose={onClose}
      aside={
        <span className="pr-2 text-sm font-semibold text-(--mui-palette-error-main) tabular-nums">
          {draft.length} de {contacts.length}
        </span>
      }
    >
      <div className="flex-1 overflow-auto">
        <RecipientsList contacts={contacts} value={draft} onChange={setDraft} />
      </div>
      <div className="flex-none border-t-2 border-(--mui-palette-divider) p-4">
        <Button
          variant="contained"
          size="large"
          fullWidth
          className="min-h-13 text-base"
          endIcon={<Check size={18} />}
          onClick={() => onConfirm(draft)}
        >
          {draft.length > 0 ? `Confirmar ${plural(draft.length, 'contato', 'contatos')}` : 'Confirmar sem contatos'}
        </Button>
      </div>
    </FullScreenDialog>
  )
}
