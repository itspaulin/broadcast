import { Alert, Button, Dialog, DialogActions, DialogContent, DialogTitle, IconButton } from '@mui/material'
import { X } from 'lucide-react'
import type { FormEventHandler, ReactNode } from 'react'

type Props = {
  open: boolean
  title: string
  submitLabel: string
  submitting: boolean
  error?: string
  onSubmit: FormEventHandler<HTMLFormElement>
  onClose: () => void
  children: ReactNode
}

export const FormDialog = ({ open, title, submitLabel, submitting, error, onSubmit, onClose, children }: Props) => (
  <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
    <form onSubmit={onSubmit} noValidate className="contents">
      <DialogTitle className="flex items-center justify-between gap-2">
        {title}
        <IconButton aria-label="Fechar" onClick={onClose} className="-my-2 -mr-2">
          <X size={18} />
        </IconButton>
      </DialogTitle>
      <DialogContent className="flex flex-col gap-4">
        {error && <Alert severity="error">{error}</Alert>}
        {children}
      </DialogContent>
      <DialogActions>
        <Button variant="outlined" color="inherit" onClick={onClose}>
          Cancelar
        </Button>
        <Button type="submit" variant="contained" disabled={submitting}>
          {submitLabel}
        </Button>
      </DialogActions>
    </form>
  </Dialog>
)
