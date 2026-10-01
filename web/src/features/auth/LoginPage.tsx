import { signInInputSchema } from '@broadcast/shared'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link } from '@mui/material'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link as RouterLink } from 'react-router'
import { FormTextField } from '../../components/FormTextField'
import { SubmitButton } from '../../components/SubmitButton'
import { AuthErrorAlert } from './AuthErrorAlert'
import { AuthLayout } from './AuthLayout'
import { describeAuthError, signIn, type AuthError } from './authService'

export const LoginPage = () => {
  const [error, setError] = useState<AuthError | null>(null)
  // onTouched: validate when leaving a field, never while the user is still typing in it.
  const { control, handleSubmit, formState } = useForm({
    resolver: zodResolver(signInInputSchema),
    defaultValues: { email: '', password: '' },
    mode: 'onTouched',
  })

  const onSubmit = handleSubmit(async (values) => {
    setError(null)
    try {
      await signIn(values)
    } catch (caught) {
      setError(describeAuthError(caught))
    }
  })

  return (
    <AuthLayout
      title="Entrar"
      footer={
        <>
          Ainda não tem conta?{' '}
          <Link component={RouterLink} to="/signup">
            Criar conta
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-5">
        {error && <AuthErrorAlert error={error} />}
        <FormTextField control={control} name="email" label="E-mail" type="email" autoComplete="email" autoFocus />
        <FormTextField
          control={control}
          name="password"
          label="Senha"
          type="password"
          autoComplete="current-password"
          placeholder="Sua senha"
        />
        <SubmitButton submitting={formState.isSubmitting} label="Entrar" submittingLabel="Entrando…" />
      </form>
    </AuthLayout>
  )
}
