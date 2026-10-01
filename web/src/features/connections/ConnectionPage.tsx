import { COLLECTIONS, type Connection } from '@broadcast/shared'
import { Alert, CircularProgress, Tab, Tabs, Typography, useMediaQuery, useTheme } from '@mui/material'
import { Link, Outlet, useLocation, useParams } from 'react-router'
import { useDocumentData } from '../../lib/firestoreHooks'

export const ConnectionPage = () => {
  const { connectionId } = useParams()
  const { pathname } = useLocation()
  const isDesktop = useMediaQuery(useTheme().breakpoints.up('md'))
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

  const tab = pathname.endsWith('/broadcast') ? 'broadcast' : 'contacts'

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
          <Tab value="contacts" label="Contatos" component={Link} to="contacts" />
          <Tab value="broadcast" label="Broadcast" component={Link} to="broadcast" />
        </Tabs>
      </header>
      <div className="px-4 py-3 md:px-8 md:py-6">
        <Outlet context={connection} />
      </div>
    </div>
  )
}
