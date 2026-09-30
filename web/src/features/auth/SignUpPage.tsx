import { PASSWORD_MIN_LENGTH, signUpInputSchema } from '@broadcast/shared'
import { zodResolver } from '@hookform/resolvers/zod'
import { Alert, Button, Link } from '@mui/material'
import { useForm } from 'react-hook-form'
import { Link as RouterLink } from 'react-router'
import { FormTextField } from '../../components/FormTextField'
import { AuthLayout } from './AuthLayout'
import { authErrorMessage, signUp } from './authService'

export const SignUpPage = () => {
  const { control, handleSubmit, setError, formState } = useForm({
    resolver: zodResolver(signUpInputSchema),
    defaultValues: { name: '', email: '', password: '' },
  })

  const onSubmit = handleSubmit(async (values) => {
    try {
      await signUp(values)
    } catch (error) {
      setError('root', { message: authErrorMessage(error) })
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
      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
        {formState.errors.root && <Alert severity="error">{formState.errors.root.message}</Alert>}
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
        <Button type="submit" variant="contained" size="large" loading={formState.isSubmitting}>
          Criar conta
        </Button>
      </form>
    </AuthLayout>
  )
}
