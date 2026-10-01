import { Paper, Typography } from '@mui/material'
import type { ReactNode } from 'react'

type Props = {
  title: string
  footer: ReactNode
  children: ReactNode
}

export const AuthLayout = ({ title, footer, children }: Props) => (
  <main className="flex min-h-screen items-center justify-center px-4">
    <Paper variant="outlined" className="flex w-full max-w-sm flex-col gap-6 p-6 sm:p-8">
      <div>
        <Typography variant="overline" color="primary">
          Broadcast
        </Typography>
        <Typography variant="h5" component="h1">
          {title}
        </Typography>
      </div>
      {children}
      <Typography variant="body2" color="text.secondary" className="text-center">
        {footer}
      </Typography>
    </Paper>
  </main>
)
