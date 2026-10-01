import { Button, Typography } from '@mui/material'
import { Plug, Plus } from 'lucide-react'
import { useState } from 'react'
import { ConnectionDialog } from './ConnectionDialog'

export const ConnectionsHome = () => {
  const [creating, setCreating] = useState(false)

  return (
    <div className="flex max-w-xl flex-col items-start gap-5 px-4 py-10 md:box-content md:px-24 md:pt-44">
      <Plug size={40} strokeWidth={1.75} className="text-(--mui-palette-primary-main)" />
      <Typography variant="h4" component="h1">
        Escolha uma conexão para começar
      </Typography>
      <Typography color="text.secondary" className="text-pretty text-[17px]">
        Cada conexão é um canal de envio, como "Loja Centro" ou "Delivery", com seus próprios contatos e
        mensagens. Selecione uma na lista ou crie uma nova.
      </Typography>
      <Button variant="contained" size="large" startIcon={<Plus size={18} />} onClick={() => setCreating(true)}>
        Nova conexão
      </Button>
      <ConnectionDialog open={creating} onClose={() => setCreating(false)} />
    </div>
  )
}
