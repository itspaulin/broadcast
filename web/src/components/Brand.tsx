import { Typography } from '@mui/material'

export const Brand = ({ className = '' }: { className?: string }) => (
  <span className={`flex items-center gap-2.5 ${className}`}>
    <span className="size-5 bg-(--mui-palette-primary-main)" />
    <Typography variant="h6" component="span">
      Broadcast
    </Typography>
  </span>
)
