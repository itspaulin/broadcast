import { Typography } from '@mui/material'
import type { ReactNode } from 'react'

export const Placeholder = ({ children }: { children: ReactNode }) => (
  <Typography className="p-6" color="text.secondary">
    {children}
  </Typography>
)
