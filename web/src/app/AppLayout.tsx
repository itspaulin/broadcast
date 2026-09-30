import { COLLECTIONS, type Client } from '@broadcast/shared'
import LogoutIcon from '@mui/icons-material/Logout'
import { AppBar, Button, Toolbar, Typography } from '@mui/material'
import { Outlet } from 'react-router'
import { useCurrentUser } from '../features/auth/authContext'
import { signOut } from '../features/auth/authService'
import { useDocumentData } from '../lib/firestoreHooks'

export const AppLayout = () => {
  const user = useCurrentUser()
  const { data: client } = useDocumentData<Client>(`${COLLECTIONS.clients}/${user.uid}`)

  return (
    <div className="flex min-h-screen flex-col">
      <AppBar position="static" elevation={0}>
        <Toolbar className="gap-2">
          <Typography variant="h6" component="span" className="flex-1">
            Broadcast
          </Typography>
          <Typography variant="body2" className="hidden sm:block">
            {client?.name ?? user.email}
          </Typography>
          <Button color="inherit" startIcon={<LogoutIcon />} onClick={() => signOut()}>
            Sair
          </Button>
        </Toolbar>
      </AppBar>
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  )
}
