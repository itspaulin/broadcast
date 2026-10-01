import { COLLECTIONS, type Client } from '@broadcast/shared'
import { AppBar, Button, Drawer, IconButton, Toolbar, Typography, useMediaQuery, useTheme } from '@mui/material'
import { LogOut, Menu as MenuIcon, X } from 'lucide-react'
import { useState } from 'react'
import { Outlet, useParams } from 'react-router'
import { Brand } from '../components/Brand'
import { useCurrentUser } from '../features/auth/authContext'
import { signOut } from '../features/auth/authService'
import { ConnectionsNav } from '../features/connections/ConnectionsNav'
import { useConnections } from '../features/connections/connectionsService'
import { useDocumentData } from '../lib/firestoreHooks'

const RULE = 'border-(--mui-palette-divider)'

export const AppLayout = () => {
  const user = useCurrentUser()
  const { connectionId } = useParams()
  const { data: client } = useDocumentData<Client>(`${COLLECTIONS.clients}/${user.uid}`)
  const connections = useConnections(user.uid)
  const isDesktop = useMediaQuery(useTheme().breakpoints.up('md'))
  const [drawerOpen, setDrawerOpen] = useState(false)

  const closeDrawer = () => setDrawerOpen(false)
  const clientName = client?.name ?? user.email
  const openConnection = connections.data.find((connection) => connection.id === connectionId)

  const signOutButton = (
    <Button variant="outlined" color="inherit" startIcon={<LogOut size={16} />} onClick={() => signOut()}>
      Sair
    </Button>
  )

  return (
    <div className="flex min-h-dvh flex-col">
      <AppBar
        position="sticky"
        color="inherit"
        className={`border-b-2 bg-(--mui-palette-background-default) ${RULE}`}
      >
        {isDesktop ? (
          <Toolbar disableGutters className="min-h-16 gap-4 px-6">
            <Brand className="mr-auto" />
            <Typography variant="body2" color="text.secondary">
              {clientName}
            </Typography>
            {signOutButton}
          </Toolbar>
        ) : (
          // On phones the bar carries the context (the open connection); account and sign-out live in the drawer.
          <Toolbar disableGutters className="min-h-14 gap-1 px-1">
            <IconButton aria-label="Abrir conexões" className="size-11" onClick={() => setDrawerOpen(true)}>
              <MenuIcon size={22} />
            </IconButton>
            {openConnection ? (
              <Typography variant="h6" component="span" noWrap className="flex-1">
                {openConnection.name}
              </Typography>
            ) : (
              <Brand className="ml-2" />
            )}
          </Toolbar>
        )}
      </AppBar>

      <div className="flex flex-1">
        <Drawer
          variant={isDesktop ? 'permanent' : 'temporary'}
          open={isDesktop || drawerOpen}
          onClose={closeDrawer}
          className={isDesktop ? 'w-70 flex-none' : ''}
          slotProps={{
            paper: {
              className: isDesktop
                ? `sticky top-16 h-[calc(100dvh-4rem)] w-70 border-r-2 ${RULE}`
                : 'w-[310px] max-w-[85vw]',
            },
          }}
        >
          {!isDesktop && (
            <div className={`flex h-14 flex-none items-center border-b-2 pr-2 pl-5 ${RULE}`}>
              <Brand className="flex-1" />
              <IconButton aria-label="Fechar" className="size-11" onClick={closeDrawer}>
                <X size={20} />
              </IconButton>
            </div>
          )}

          <ConnectionsNav connections={connections} onNavigate={closeDrawer} />

          {!isDesktop && (
            <div className={`mt-auto flex items-center gap-3 border-t-2 px-5 py-4 ${RULE}`}>
              <div className="min-w-0 flex-1">
                <Typography variant="subtitle1" noWrap>
                  {clientName}
                </Typography>
                {client?.name && (
                  <Typography variant="body2" color="text.secondary" noWrap>
                    {user.email}
                  </Typography>
                )}
              </div>
              {signOutButton}
            </div>
          )}
        </Drawer>

        <main className="min-w-0 flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
