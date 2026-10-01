import { Alert, Button } from '@mui/material'
import { RefreshCw, TriangleAlert } from 'lucide-react'

type Props = {
  title: string
  hint: string
  onRetry: () => void
}

export const LoadError = ({ title, hint, onRetry }: Props) => (
  <div className="flex flex-col items-start gap-4">
    <Alert severity="error" icon={<TriangleAlert size={20} />} className="w-full">
      <strong className="font-semibold">{title}</strong>
      <br />
      {hint}
    </Alert>
    <Button variant="outlined" color="inherit" startIcon={<RefreshCw size={16} />} onClick={onRetry}>
      Tentar novamente
    </Button>
  </div>
)
