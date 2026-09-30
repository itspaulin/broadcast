import type { User } from 'firebase/auth'
import { createContext, useContext } from 'react'

export type AuthState = {
  user: User | null
  loading: boolean
}

export const AuthContext = createContext<AuthState>({ user: null, loading: true })

export const useAuth = () => useContext(AuthContext)

export const useCurrentUser = () => {
  const { user } = useAuth()
  if (!user) throw new Error('useCurrentUser must be used inside RequireAuth')
  return user
}
