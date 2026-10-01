import { Typography } from '@mui/material'

type Props = {
  className?: string
  // For the solid accent panel, where the mark flips to the ground color.
  inverted?: boolean
}

export const Brand = ({ className = '', inverted = false }: Props) => (
  <span className={`flex items-center gap-2.5 ${className}`}>
    <span
      className={`size-5 ${inverted ? 'bg-(--mui-palette-background-default)' : 'bg-(--mui-palette-primary-main)'}`}
    />
    <Typography variant="h6" component="span">
      Broadcast
    </Typography>
  </span>
)
