import { createBrowserRouter, Navigate } from 'react-router'
import { GuestOnly, RequireAuth } from '../features/auth/guards'
import { LoginPage } from '../features/auth/LoginPage'
import { SignUpPage } from '../features/auth/SignUpPage'
import { ConnectionPage } from '../features/connections/ConnectionPage'
import { ConnectionsHome } from '../features/connections/ConnectionsHome'
import { ContactsPage } from '../features/contacts/ContactsPage'
import { BroadcastPage } from '../features/messages/BroadcastPage'
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
          { index: true, element: <ConnectionsHome /> },
          {
            path: 'connections/:connectionId',
            element: <ConnectionPage />,
            children: [
              { index: true, element: <Navigate to="contacts" replace /> },
              { path: 'contacts', element: <ContactsPage /> },
              { path: 'broadcast', element: <BroadcastPage /> },
            ],
          },
        ],
      },
    ],
  },
  { path: '*', element: <Navigate to="/" replace /> },
])
