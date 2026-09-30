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

const INVALID_CREDENTIALS = 'E-mail ou senha incorretos.'

// Production (email enumeration protection) only returns invalid-credential; the emulator
// still distinguishes wrong password from unknown user.
const AUTH_ERRORS: Record<string, string> = {
  'auth/invalid-credential': INVALID_CREDENTIALS,
  'auth/wrong-password': INVALID_CREDENTIALS,
  'auth/user-not-found': INVALID_CREDENTIALS,
  'auth/email-already-in-use': 'Este e-mail já está cadastrado.',
  'auth/weak-password': 'Senha muito fraca.',
  'auth/too-many-requests': 'Muitas tentativas. Aguarde alguns minutos e tente novamente.',
  'auth/network-request-failed': 'Sem conexão. Verifique sua internet.',
}

export const authErrorMessage = (error: unknown) =>
  (error instanceof FirebaseError && AUTH_ERRORS[error.code]) || 'Não foi possível concluir. Tente novamente.'
