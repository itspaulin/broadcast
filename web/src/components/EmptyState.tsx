import { Typography } from '@mui/material'
import type { ReactNode } from 'react'

type Props = {
  icon: ReactNode
  title: string
  description: string
  action?: ReactNode
}

export const EmptyState = ({ icon, title, description, action }: Props) => (
  <div className="flex max-w-lg flex-col items-start gap-3.5 py-6">
    <span className="text-(--mui-palette-primary-main)">{icon}</span>
    <Typography variant="h6" component="h2">
      {title}
    </Typography>
    <Typography color="text.secondary" className="text-pretty">
      {description}
    </Typography>
    {action}
  </div>
)
