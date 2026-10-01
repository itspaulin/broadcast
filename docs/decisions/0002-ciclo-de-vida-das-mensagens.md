# ADR 0002 — Ciclo de vida das mensagens e envio agendado

- Status: aceito
- Data: 2026-10-01

## Contexto

O [ADR 0001](0001-modelagem-e-isolamento.md) definiu que mensagens são lidas direto pelo front e escritas só por Cloud Functions. Este ADR detalha o que essas functions garantem.

Uma mensagem tem dois estados: `scheduled` e `sent`. Ela nasce em um dos dois e só anda em uma direção:

```
createMessage (scheduledAt: null) ───────────────► sent
createMessage (scheduledAt futuro) ─► scheduled ─► sent   (agendador, no horário)
```

Requisitos:

- A passagem de `scheduled` para `sent` acontece no backend, sem depender do app aberto.
- Mensagens podem ser editadas e excluídas, inclusive enquanto o agendador roda.
- O envio é simulado: não há provedor externo.

## Decisão

### Criação (`createMessage`)

- A conexão e todos os contatos são lidos dentro de uma transação e precisam pertencer ao cliente e à mesma conexão. Um contato excluído ao mesmo tempo não entra na mensagem.
- Contato inexistente, de outro cliente ou de outra conexão recebem a mesma resposta (`failed-precondition`), para não revelar se um id existe em outro cliente.
- Envio imediato grava `status: 'sent'`, `sentAt` com o horário do servidor e todos os destinatários em `recipients` como `sent`.
- Agendamento grava `status: 'scheduled'` e `recipients` vazio: o status por destinatário só existe depois do envio.
- Horário no passado é rejeitado (`invalid-argument`), não convertido em envio imediato.
- No máximo 500 destinatários por mensagem: `recipients` é um mapa dentro do documento, limitado a 1 MiB.

### Edição (`updateMessage`)

| Estado      | O que pode mudar                  | Condição                         |
| ----------- | --------------------------------- | -------------------------------- |
| `scheduled` | texto, destinatários e horário    | novo horário no futuro           |
| `sent`      | só o texto                        | até 15 minutos depois do `sentAt` |

- Em mensagens enviadas, destinatários e horário já foram consumidos pelo envio. Mandar esses campos retorna erro, em vez de serem ignorados em silêncio.
- Editar uma mensagem enviada marca `editedAt`, que a interface usa para o rótulo "editado". Editar uma agendada não marca: a alteração nunca foi visível para o destinatário.
- Uma mensagem agendada continua agendada: não há conversão para envio imediato na edição.
- Toda edição grava em `messageRevisions` a versão **anterior**. O documento em `messages` é sempre a versão vigente e as revisões são o histórico.
- A mensagem é lida dentro da transação. Se o agendador enviá-la no meio da edição, a transação repete e passa a aplicar as regras de mensagem enviada.

### Exclusão (`deleteMessage`)

- Mensagem e revisões são excluídas na mesma transação, então uma edição simultânea não deixa revisão órfã.
- Não há restrição por estado ou prazo. A janela de 15 minutos vale só para edição.

### Envio agendado (`sendScheduledMessages`)

Uma função `onSchedule` roda a cada minuto e:

1. Busca até 500 mensagens com `status == 'scheduled'` e `scheduledAt <= agora`, ordenadas por `scheduledAt`.
2. Atualiza cada uma para `sent` em escritas independentes e paralelas, com a precondição `lastUpdateTime` igual ao `updateTime` lido na busca.
3. Repete enquanto a página vier cheia e ao menos uma escrita tiver sucesso.

O que isso garante:

- **Não sobrescreve edição nem exclusão**: se a mensagem mudou depois da busca, o `updateTime` é outro e a escrita falha. Uma mensagem reagendada para mais tarde deixa de estar vencida; uma que continua vencida é enviada na execução seguinte.
- **Idempotência**: uma execução repetida ou duas execuções sobrepostas não enviam a mesma mensagem duas vezes. A primeira escrita muda o `updateTime` e a segunda falha; e mensagens já `sent` não voltam na busca.
- **Falhas isoladas**: como cada mensagem é uma escrita independente, a falha de uma não desfaz as outras. Num `WriteBatch`, uma única precondição falha derrubaria as 500.
- **Sem laço infinito**: mensagens que falham continuam vencidas e voltariam na próxima busca. Por isso o laço para numa página sem nenhum sucesso e deixa o resto para a execução seguinte.

A busca não filtra por `clientId`: o agendador roda com o Admin SDK, fora das Security Rules, e atende todos os clientes numa execução. É o único índice composto de `messages` que não começa por `clientId`: `(status, scheduledAt)`.

## Alternativas consideradas

- **Cloud Tasks, uma tarefa por mensagem**: envia no horário exato, sem varredura. Em troca, cada edição de horário e cada exclusão precisaria cancelar e recriar a tarefa, e uma falha nessa sincronia deixaria uma tarefa apontando para uma mensagem que mudou. A varredura não guarda estado fora do Firestore.
- **`WriteBatch` de 500 com precondição**: menos chamadas de rede, mas atômico: uma mensagem editada no meio da execução faria o lote inteiro falhar.
- **Transação por mensagem**: mesma garantia da precondição, com uma leitura a mais por mensagem.
- **Trigger do Firestore com espera até o horário**: uma function não pode ficar aguardando por horas, e o limite de execução é de minutos.
- **Marcar como enviada pelo front, ao abrir a tela**: contraria o requisito de não depender do app aberto.

## Consequências

- Uma mensagem pode ser enviada até cerca de um minuto depois do horário agendado. `sentAt` registra o horário real do envio, não o agendado.
- A função roda a cada minuto mesmo sem mensagens vencidas: uma leitura de índice por execução.
- A vazão é limitada pelo tempo de execução da função. Um acúmulo maior que isso é drenado nas execuções seguintes, em ordem de `scheduledAt`.
- Funções agendadas exigem o plano Blaze (Cloud Scheduler).
- A lógica de envio (`sendDueMessages`) é separada do gatilho, o que permite exercitá-la nos testes sem esperar o agendador.
