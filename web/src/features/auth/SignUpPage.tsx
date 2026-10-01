import { PASSWORD_MIN_LENGTH, signUpInputSchema } from '@broadcast/shared'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link } from '@mui/material'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link as RouterLink } from 'react-router'
import { FormTextField } from '../../components/FormTextField'
import { SubmitButton } from '../../components/SubmitButton'
import { AuthErrorAlert } from './AuthErrorAlert'
import { AuthLayout } from './AuthLayout'
import { describeAuthError, isEmailInUse, signUp, type AuthError } from './authService'

export const SignUpPage = () => {
  const [error, setError] = useState<AuthError | null>(null)
  const { control, handleSubmit, setError: setFieldError, formState } = useForm({
    resolver: zodResolver(signUpInputSchema),
    defaultValues: { name: '', email: '', password: '' },
    mode: 'onTouched',
  })

  const onSubmit = handleSubmit(async (values) => {
    setError(null)
    try {
      await signUp(values)
    } catch (caught) {
      if (isEmailInUse(caught)) setFieldError('email', { message: 'Este e-mail já está cadastrado.' })
      else setError(describeAuthError(caught))
    }
  })

  return (
    <AuthLayout
      title="Criar conta"
      footer={
        <>
          Já tem conta?{' '}
          <Link component={RouterLink} to="/login">
            Entrar
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-5">
        {error && <AuthErrorAlert error={error} />}
        <FormTextField control={control} name="name" label="Nome da empresa" autoComplete="organization" autoFocus />
        <FormTextField control={control} name="email" label="E-mail" type="email" autoComplete="email" />
        <FormTextField
          control={control}
          name="password"
          label="Senha"
          type="password"
          autoComplete="new-password"
          helperText={`Mínimo de ${PASSWORD_MIN_LENGTH} caracteres`}
        />
        <SubmitButton submitting={formState.isSubmitting} label="Criar conta" submittingLabel="Criando conta…" />
      </form>
    </AuthLayout>
  )
}
