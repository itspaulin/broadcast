import { Alert } from '@mui/material'
import { TriangleAlert } from 'lucide-react'
import type { AuthError } from './authService'

// Sits above the fields, where the eye starts; field errors stay under their field.
export const AuthErrorAlert = ({ error }: { error: AuthError }) => (
  <Alert severity="error" icon={<TriangleAlert size={18} />}>
    <strong className="font-semibold">{error.title}</strong>
    <br />
    {error.hint}
  </Alert>
)
