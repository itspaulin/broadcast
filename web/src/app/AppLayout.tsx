import { COLLECTIONS, type Client } from '@broadcast/shared'
import LogoutIcon from '@mui/icons-material/Logout'
import MenuIcon from '@mui/icons-material/Menu'
import { AppBar, Button, Drawer, IconButton, Toolbar, Typography, useMediaQuery, useTheme } from '@mui/material'
import { useState } from 'react'
import { Outlet } from 'react-router'
import { useCurrentUser } from '../features/auth/authContext'
import { signOut } from '../features/auth/authService'
import { ConnectionsNav } from '../features/connections/ConnectionsNav'
import { useDocumentData } from '../lib/firestoreHooks'

const DRAWER_WIDTH = 280

export const AppLayout = () => {
  const user = useCurrentUser()
  const { data: client } = useDocumentData<Client>(`${COLLECTIONS.clients}/${user.uid}`)
  const isDesktop = useMediaQuery(useTheme().breakpoints.up('md'))
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="flex min-h-screen flex-col">
      <AppBar position="sticky" elevation={0}>
        <Toolbar className="gap-2">
          {!isDesktop && (
            <IconButton color="inherit" edge="start" aria-label="Abrir conexões" onClick={() => setMobileOpen(true)}>
              <MenuIcon />
            </IconButton>
          )}
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

      <div className="flex flex-1">
        <Drawer
          variant={isDesktop ? 'permanent' : 'temporary'}
          open={isDesktop || mobileOpen}
          onClose={() => setMobileOpen(false)}
          sx={{ width: DRAWER_WIDTH, flexShrink: 0, '& .MuiDrawer-paper': { width: DRAWER_WIDTH, position: isDesktop ? 'relative' : 'fixed' } }}
        >
          <ConnectionsNav onNavigate={() => setMobileOpen(false)} />
        </Drawer>
        <main className="min-w-0 flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
