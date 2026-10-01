import { Alert, Button, Dialog, DialogActions, DialogContent, DialogTitle, Skeleton, Typography } from '@mui/material'
import { LoaderCircle, Trash2 } from 'lucide-react'
import { useEffect, useEffectEvent, useState, type ReactNode } from 'react'

type Props = {
  open: boolean
  // Names the object ('Excluir "Loja Centro"?'); the button repeats verb + object.
  title: string
  confirmLabel: string
  loadingHint: string
  // Loads what else the deletion affects; runs on every open and must not reject.
  describe: () => Promise<ReactNode>
  onConfirm: () => Promise<void>
  errorMessage: (error: unknown) => string
  onClose: () => void
}

export const ConfirmDeleteDialog = ({
  open,
  title,
  confirmLabel,
  loadingHint,
  describe,
  onConfirm,
  errorMessage,
  onClose,
}: Props) => {
  const [impact, setImpact] = useState<{ content: ReactNode } | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const loadImpact = useEffectEvent(describe)

  useEffect(() => {
    if (!open) return
    let active = true
    loadImpact().then((content) => active && setImpact({ content }))
    return () => {
      active = false
    }
  }, [open])

  const close = () => {
    setImpact(null)
    setError(null)
    onClose()
  }

  const confirm = async () => {
    setDeleting(true)
    setError(null)
    try {
      await onConfirm()
      close()
    } catch (caught) {
      setError(errorMessage(caught))
    } finally {
      setDeleting(false)
    }
  }

  const busy = impact === null || deleting

  return (
    <Dialog open={open} onClose={deleting ? undefined : close} fullWidth maxWidth="xs">
      <DialogTitle>{title}</DialogTitle>
      <DialogContent className="flex flex-col gap-4">
        {error && <Alert severity="error">{error}</Alert>}
        {/* The dialog opens right away, so the click never looks ignored while the impact loads. */}
        {impact === null ? (
          <>
            <div className="flex flex-col gap-2">
              <Skeleton height={12} />
              <Skeleton height={12} width="70%" />
            </div>
            <Typography variant="body2" color="text.secondary">
              {loadingHint}
            </Typography>
          </>
        ) : (
          impact.content
        )}
      </DialogContent>
      <DialogActions>
        <Button variant="outlined" color="inherit" onClick={close} disabled={deleting} autoFocus>
          Cancelar
        </Button>
        <Button
          variant="contained"
          color="error"
          onClick={confirm}
          disabled={busy}
          startIcon={busy ? <LoaderCircle size={16} className="animate-spin" /> : <Trash2 size={16} />}
        >
          {confirmLabel}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
