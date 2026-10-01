import { Divider, Typography } from '@mui/material'
import type { ReactNode } from 'react'
import { Brand } from '../../components/Brand'

type Props = {
  title: string
  footer: ReactNode
  children: ReactNode
}

// The accent panel is the only field of color in the product: identity lives at sign-in,
// and inside the app red goes back to meaning "primary action".
export const AuthLayout = ({ title, footer, children }: Props) => (
  <div className="grid min-h-dvh grid-rows-[auto_1fr] md:grid-cols-2 md:grid-rows-1">
    <div className="flex flex-col justify-between gap-10 bg-(--mui-palette-primary-main) px-5 pt-6 pb-7 text-(--mui-palette-primary-contrastText) md:p-12">
      <Brand inverted />
      <p className="max-w-[560px] text-[40px] leading-[0.98] font-extrabold tracking-[-0.03em] md:text-[88px] md:leading-[0.95]">
        Uma mensagem. Todos os seus clientes.
      </p>
      <p className="max-w-[420px] text-lg max-md:hidden">
        Envie na hora ou agende para depois. Sem planilhas, sem copiar e colar.
      </p>
    </div>

    <main className="flex flex-col px-5 py-7 md:justify-center md:px-24 md:py-12">
      <div className="flex w-full max-w-[400px] flex-col gap-5">
        <Typography variant="h4" component="h1">
          {title}
        </Typography>
        {children}
        <Divider className="border-b-2" />
        <Typography variant="body2" className="text-sm">
          {footer}
        </Typography>
      </div>
    </main>
  </div>
)
