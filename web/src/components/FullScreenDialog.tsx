import { Dialog, IconButton, Typography } from '@mui/material'
import type { ReactNode } from 'react'

type Props = {
  open: boolean
  title: string
  closeIcon: ReactNode
  closeLabel: string
  onClose: () => void
  // Shown at the end of the header, e.g. a counter.
  aside?: ReactNode
  children: ReactNode
}

// A whole screen on phones: fixed header, and the children own the scrolling body and footer.
export const FullScreenDialog = ({ open, title, closeIcon, closeLabel, onClose, aside, children }: Props) => (
  <Dialog
    open={open}
    onClose={onClose}
    fullScreen
    slotProps={{
      paper: { 'aria-label': title, className: 'm-0 w-full gap-0 bg-(--mui-palette-background-default) p-0' },
    }}
  >
    <header className="flex h-14 flex-none items-center gap-2 border-b-2 border-(--mui-palette-divider) px-2">
      <IconButton aria-label={closeLabel} onClick={onClose} className="size-11">
        {closeIcon}
      </IconButton>
      <Typography variant="h6" component="h2" className="flex-1 text-lg">
        {title}
      </Typography>
      {aside}
    </header>
    {children}
  </Dialog>
)
