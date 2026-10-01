import { COLLECTIONS, type SignInInput, type SignUpInput } from '@broadcast/shared'
import { FirebaseError } from 'firebase/app'
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut as firebaseSignOut } from 'firebase/auth'
import { doc, setDoc } from 'firebase/firestore'
import { auth, db } from '../../lib/firebase'

export const signIn = ({ email, password }: SignInInput) => signInWithEmailAndPassword(auth, email, password)

// The Auth trigger fills email and createdAt; merge lets either write land first.
export const signUp = async ({ name, email, password }: SignUpInput) => {
  const { user } = await createUserWithEmailAndPassword(auth, email, password)
  await setDoc(doc(db, COLLECTIONS.clients, user.uid), { name }, { merge: true })
}

export const signOut = () => firebaseSignOut(auth)

export type AuthError = { title: string; hint: string }

const INVALID_CREDENTIALS: AuthError = {
  title: 'E-mail ou senha incorretos.',
  hint: 'Confira os dados e tente de novo.',
}

// Production (email enumeration protection) only returns invalid-credential; the emulator
// still distinguishes wrong password from unknown user.
const AUTH_ERRORS: Record<string, AuthError> = {
  'auth/invalid-credential': INVALID_CREDENTIALS,
  'auth/wrong-password': INVALID_CREDENTIALS,
  'auth/user-not-found': INVALID_CREDENTIALS,
  'auth/too-many-requests': { title: 'Muitas tentativas.', hint: 'Aguarde alguns minutos e tente de novo.' },
  'auth/network-request-failed': { title: 'Sem conexão.', hint: 'Verifique sua internet e tente de novo.' },
}

const UNEXPECTED: AuthError = { title: 'Não foi possível concluir.', hint: 'Tente de novo em instantes.' }

export const describeAuthError = (error: unknown) =>
  (error instanceof FirebaseError && AUTH_ERRORS[error.code]) || UNEXPECTED

export const isEmailInUse = (error: unknown) =>
  error instanceof FirebaseError && error.code === 'auth/email-already-in-use'
