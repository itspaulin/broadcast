import { CircularProgress } from '@mui/material'

export const FullPageLoader = () => (
  <div className="flex min-h-screen items-center justify-center">
    <CircularProgress aria-label="Carregando" />
  </div>
)
