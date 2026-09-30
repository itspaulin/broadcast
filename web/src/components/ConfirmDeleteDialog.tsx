import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Skeleton,
} from '@mui/material'
import { useEffect, useEffectEvent, useState } from 'react'

type Props = {
  open: boolean
  title: string
  // Loads what else the deletion affects; runs on every open and must not reject.
  describe: () => Promise<string>
  onConfirm: () => Promise<void>
  errorMessage: (error: unknown) => string
  onClose: () => void
}

export const ConfirmDeleteDialog = ({ open, title, describe, onConfirm, errorMessage, onClose }: Props) => {
  const [description, setDescription] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const loadDescription = useEffectEvent(describe)

  useEffect(() => {
    if (!open) return
    let active = true
    loadDescription().then((text) => active && setDescription(text))
    return () => {
      active = false
    }
  }, [open])

  const close = () => {
    setDescription(null)
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

  return (
    <Dialog open={open} onClose={deleting ? undefined : close} fullWidth maxWidth="xs">
      <DialogTitle>{title}</DialogTitle>
      <DialogContent className="flex flex-col gap-3">
        {error && <Alert severity="error">{error}</Alert>}
        {description === null ? (
          <Skeleton />
        ) : (
          <DialogContentText>{description} Esta ação não pode ser desfeita.</DialogContentText>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={close} disabled={deleting}>
          Cancelar
        </Button>
        <Button color="error" variant="contained" onClick={confirm} loading={deleting} disabled={description === null}>
          Excluir
        </Button>
      </DialogActions>
    </Dialog>
  )
}
