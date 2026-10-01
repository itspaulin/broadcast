import { COLLECTIONS, type Connection, type WithId } from '@broadcast/shared'
import { Alert, CircularProgress, Tab, Tabs, Typography, useMediaQuery, useTheme } from '@mui/material'
import { Link, Outlet, useLocation, useParams } from 'react-router'
import { CountBadge } from '../../components/CountBadge'
import { useDocumentData } from '../../lib/firestoreHooks'
import { useCurrentUser } from '../auth/authContext'
import { useContacts } from '../contacts/contactsService'
import type { ConnectionContext } from './connectionContext'

const ConnectionTabs = ({ connection }: { connection: WithId<Connection> }) => {
  const user = useCurrentUser()
  const { pathname } = useLocation()
  const isDesktop = useMediaQuery(useTheme().breakpoints.up('md'))
  const contacts = useContacts(user.uid, connection.id)

  const tab = pathname.endsWith('/broadcast') ? 'broadcast' : 'contacts'
  const context: ConnectionContext = { connection, contacts }

  return (
    <div className="flex flex-col">
      <header className="border-b-2 border-(--mui-palette-divider) md:px-8 md:pt-7">
        {/* On phones the app bar already shows the connection name. */}
        <Typography variant="h4" component="h1" noWrap className="mb-4 max-md:sr-only">
          {connection.name}
        </Typography>
        <Tabs
          value={tab}
          variant={isDesktop ? 'standard' : 'fullWidth'}
          aria-label="Seções da conexão"
          className="-mb-0.5"
        >
          <Tab
            value="contacts"
            component={Link}
            to="contacts"
            label={
              // The count stays visible from the Broadcast tab too.
              <span className="flex items-center gap-2">
                Contatos
                {!contacts.loading && !contacts.error && (
                  <CountBadge count={contacts.data.length} solid={tab === 'contacts'} />
                )}
              </span>
            }
          />
          <Tab value="broadcast" label="Broadcast" component={Link} to="broadcast" />
        </Tabs>
      </header>
      <Outlet context={context} />
    </div>
  )
}

export const ConnectionPage = () => {
  const { connectionId } = useParams()
  const { data: connection, loading, error } = useDocumentData<Connection>(
    `${COLLECTIONS.connections}/${connectionId}`,
  )

  if (loading) {
    return (
      <div className="flex justify-center p-12">
        <CircularProgress aria-label="Carregando conexão" />
      </div>
    )
  }

  // Rules deny reading another client's document, so a foreign id also lands here.
  if (error || !connection) {
    return (
      <Alert severity="warning" className="m-4 md:m-8">
        Conexão não encontrada.
      </Alert>
    )
  }

  // Keyed so switching connections starts the tabs (and their subscriptions) from scratch.
  return <ConnectionTabs key={connection.id} connection={connection} />
}
