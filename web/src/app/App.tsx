import { RouterProvider } from 'react-router'
import { AuthProvider } from '../features/auth/AuthProvider'
import { router } from './router'

export const App = () => (
  <AuthProvider>
    <RouterProvider router={router} />
  </AuthProvider>
)
