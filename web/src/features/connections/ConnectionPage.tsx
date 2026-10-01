import { COLLECTIONS, type Connection } from '@broadcast/shared'
import { Alert, CircularProgress, Tab, Tabs, Typography } from '@mui/material'
import { Link, Outlet, useLocation, useParams } from 'react-router'
import { useDocumentData } from '../../lib/firestoreHooks'

export const ConnectionPage = () => {
  const { connectionId } = useParams()
  const { pathname } = useLocation()
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
      <Alert severity="warning" className="m-6">
        Conexão não encontrada.
      </Alert>
    )
  }

  const tab = pathname.endsWith('/broadcast') ? 'broadcast' : 'contacts'

  return (
    <div className="flex flex-col">
      <header className="border-b-2 border-(--mui-palette-divider) px-4 pt-4 sm:px-6 sm:pt-6">
        <Typography variant="h5" component="h1" noWrap>
          {connection.name}
        </Typography>
        <Tabs value={tab} aria-label="Seções da conexão">
          <Tab value="contacts" label="Contatos" component={Link} to="contacts" />
          <Tab value="broadcast" label="Broadcast" component={Link} to="broadcast" />
        </Tabs>
      </header>
      <div className="p-4 sm:p-6">
        <Outlet context={connection} />
      </div>
    </div>
  )
}
