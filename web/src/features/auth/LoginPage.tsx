import { signInInputSchema } from '@broadcast/shared'
import { zodResolver } from '@hookform/resolvers/zod'
import { Alert, Button, Link } from '@mui/material'
import { useForm } from 'react-hook-form'
import { Link as RouterLink } from 'react-router'
import { FormTextField } from '../../components/FormTextField'
import { AuthLayout } from './AuthLayout'
import { authErrorMessage, signIn } from './authService'

export const LoginPage = () => {
  const { control, handleSubmit, setError, formState } = useForm({
    resolver: zodResolver(signInInputSchema),
    defaultValues: { email: '', password: '' },
  })

  const onSubmit = handleSubmit(async (values) => {
    try {
      await signIn(values)
    } catch (error) {
      setError('root', { message: authErrorMessage(error) })
    }
  })

  return (
    <AuthLayout
      title="Entrar"
      footer={
        <>
          Não tem conta?{' '}
          <Link component={RouterLink} to="/signup">
            Cadastre-se
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
        {formState.errors.root && <Alert severity="error">{formState.errors.root.message}</Alert>}
        <FormTextField control={control} name="email" label="E-mail" type="email" autoComplete="email" autoFocus />
        <FormTextField control={control} name="password" label="Senha" type="password" autoComplete="current-password" />
        <Button type="submit" variant="contained" size="large" loading={formState.isSubmitting}>
          Entrar
        </Button>
      </form>
    </AuthLayout>
  )
}
