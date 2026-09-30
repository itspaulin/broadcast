import { onAuthStateChanged } from 'firebase/auth'
import { useEffect, useState, type ReactNode } from 'react'
import { auth } from '../../lib/firebase'
import { AuthContext, type AuthState } from './authContext'

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [state, setState] = useState<AuthState>({ user: null, loading: true })

  useEffect(() => onAuthStateChanged(auth, (user) => setState({ user, loading: false })), [])

  return <AuthContext value={state}>{children}</AuthContext>
}
