import { Navigate, Outlet, useLocation } from 'react-router'
import { FullPageLoader } from '../../components/FullPageLoader'
import { useAuth } from './authContext'

type RedirectState = { from?: string } | null

export const RequireAuth = () => {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) return <FullPageLoader />
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />
  return <Outlet />
}

export const GuestOnly = () => {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) return <FullPageLoader />
  if (user) return <Navigate to={(location.state as RedirectState)?.from ?? '/'} replace />
  return <Outlet />
}
