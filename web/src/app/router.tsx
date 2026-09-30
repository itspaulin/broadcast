import { Typography } from '@mui/material'
import { createBrowserRouter, Navigate } from 'react-router'
import { GuestOnly, RequireAuth } from '../features/auth/guards'
import { LoginPage } from '../features/auth/LoginPage'
import { SignUpPage } from '../features/auth/SignUpPage'
import { AppLayout } from './AppLayout'

export const router = createBrowserRouter([
  {
    element: <GuestOnly />,
    children: [
      { path: '/login', element: <LoginPage /> },
      { path: '/signup', element: <SignUpPage /> },
    ],
  },
  {
    element: <RequireAuth />,
    children: [
      {
        element: <AppLayout />,
        children: [
          {
            index: true,
            element: (
              <Typography className="p-6" color="text.secondary">
                Selecione ou crie uma conexão.
              </Typography>
            ),
          },
        ],
      },
    ],
  },
  { path: '*', element: <Navigate to="/" replace /> },
])
