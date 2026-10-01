# ADR 0003 — Status por destinatário simulado

- Status: aceito
- Data: 2026-10-01

## Contexto

Cada mensagem enviada mostra o progresso por destinatário: enviado, entregue, lido. O envio é simulado: não há provedor que confirme entrega ou leitura, então alguma coisa precisa fazer esse progresso acontecer.

O [ADR 0001](0001-modelagem-e-isolamento.md) reservou o mapa `recipients{ [contactId]: status }` na mensagem para esse status.

## Decisão

O progresso de cada destinatário é **calculado**, não gravado. Uma função pura no `shared` (`recipientTimeline`) recebe o id da mensagem, o id do contato e o `sentAt`, e devolve quando aquele destinatário passa a "entregue" e a "lido":

- entregue entre 5 e 60 segundos depois do envio;
- lido entre 1 e 10 minutos depois da entrega, para cerca de 80% dos destinatários; os demais ficam em "entregue".

Os atrasos vêm de um hash (FNV-1a) de `messageId:contactId`. O mesmo par sempre dá o mesmo número, então o resultado é determinístico: qualquer dispositivo, em qualquer momento, calcula a mesma linha do tempo.

O front combina essa linha do tempo com o relógio (`useNow`) para saber o status atual, a contagem de lidos, entregues e enviados e o horário de cada mudança.

O mapa `recipients` continua sendo gravado no envio com todos em `sent`: ele registra para quem a mensagem foi de fato enviada. A interface não lê o status dele.

## Alternativas consideradas

- **Function agendada que avança os status no banco**: funciona sem o app aberto e usaria o mapa `recipients` como fonte. Em troca, cada mensagem geraria várias escritas ao longo de minutos (e uma atualização de snapshot para cada uma), mais uma function para manter, só para produzir um dado que é inventado de qualquer forma.
- **Sorteio no cliente (`Math.random`)**: cada aba e cada recarga mostrariam um resultado diferente.
- **Não simular**: a interface de status por destinatário ficaria sempre em "enviado".

## Consequências

- Nenhuma escrita e nenhuma leitura a mais: o status avança só com o relógio do cliente.
- O status exibido depende do relógio do dispositivo; um relógio errado mostra um progresso adiantado ou atrasado.
- O status não pode ser consultado no banco (por exemplo, "mensagens não lidas"), porque não está lá.
- Com um provedor real, os webhooks de entrega e leitura gravariam em `recipients` via field path (`recipients.<contactId>`), e a interface passaria a ler esse mapa. `recipientTimeline` seria removida; o formato do documento não muda.
