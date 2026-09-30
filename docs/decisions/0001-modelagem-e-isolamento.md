# ADR 0001 — Modelagem de dados e isolamento entre clientes

- Status: aceito
- Data: 2026-09-30

## Contexto

A aplicação é um SaaS multi-tenant: cada usuário cadastrado é um cliente, com suas conexões; cada conexão tem contatos e mensagens. Um cliente não pode ler nem alterar dados de outro.

Restrições:

- Firestore sem subcoleções.
- Tempo real do Firestore sempre que aplicável, então o front lê direto do banco.
- Mensagens agendadas mudam para "Enviada" no backend, sem depender do app aberto.

## Decisão

### Coleções na raiz com `clientId` em todo documento

| Coleção            | Id       | Campos                                                                                                                                           |
| ------------------ | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `clients`          | `uid`    | `name`, `email`, `createdAt`                                                                                                                     |
| `connections`      | auto     | `clientId`, `name`, `createdAt`, `updatedAt`                                                                                                     |
| `contacts`         | auto     | `clientId`, `connectionId`, `name`, `phone`, `createdAt`, `updatedAt`                                                                            |
| `messages`         | auto     | `clientId`, `connectionId`, `contactIds[]`, `recipients{}`, `body`, `status`, `scheduledAt`, `sentAt`, `editedAt`, `createdAt`, `updatedAt`     |
| `messageRevisions` | auto     | `clientId`, `messageId`, `body`, `contactIds[]`, `scheduledAt`, `createdAt`                                                                      |

- `clientId` é o `uid` do Firebase Auth: um usuário é um cliente, sem tabela de membros.
- `clientId` e `connectionId` são imutáveis depois da criação.
- A hierarquia (cliente → conexão → contatos/mensagens) é expressa por referência (`connectionId`), não por caminho.

### Isolamento nas Security Rules

- Leitura e escrita só quando `clientId == request.auth.uid`, tanto no documento existente quanto no novo.
- Criar um contato valida que a conexão referenciada pertence ao mesmo cliente.
- Toda query do front filtra por `clientId`. As rules não filtram resultados, só autorizam ou negam a query inteira; sem esse filtro a query é negada.

### Mensagens: leitura direta, escrita só por Cloud Functions

O front lê `messages` e `messageRevisions` com `onSnapshot`, mas não escreve nelas: as rules negam, e criar, editar e excluir passam por callables. Motivos:

- **Transições de status**: só o servidor define `status` e `sentAt`. Pelas rules, um cliente poderia marcar uma mensagem como enviada ou forjar o horário de envio.
- **Validação entre documentos**: todos os `contactIds` precisam pertencer à mesma conexão e ao mesmo cliente. As rules não iteram arrays fazendo `get()` de cada item.
- **Janela de edição e histórico**: editar uma mensagem enviada só é permitido por 15 minutos e grava a versão anterior em `messageRevisions` na mesma transação.

Conexões e contatos são CRUD simples e continuam escritos direto pelo front, validados pelas rules. As exceções são as exclusões, que afetam outros documentos e por isso também passam por callables:

- `deleteContact` remove o contato das mensagens agendadas e exclui a mensagem que ficar sem destinatários.
- `deleteConnection` exclui em cascata os contatos, as mensagens e as revisões da conexão, em lotes de 500. Sem subcoleções, não há exclusão pelo caminho do documento.

### Destinatários: `contactIds[]` e `recipients{}`

- `contactIds[]` permite `array-contains`, usado para achar as mensagens agendadas de um contato quando ele é excluído.
- `recipients{ [contactId]: 'sent' | 'delivered' | 'read' }` guarda o status por destinatário. Um mapa permite atualizar um destinatário via field path, sem reescrever o documento.

### Histórico em coleção própria

As revisões ficam em `messageRevisions`, não num array dentro da mensagem: o histórico cresce sem limite e o documento do Firestore tem teto de 1 MiB. Isso também mantém o `onSnapshot` da lista de mensagens leve.

### Tempo

Datas são gravadas como `Timestamp` do Firestore (UTC) e convertidas para o fuso local só na exibição. As callables recebem horários em millis UTC.

O pacote `shared` tipa timestamps como `{ toMillis(): number }`, interface satisfeita tanto pelo SDK web quanto pelo `firebase-admin`, então os tipos de domínio não dependem de nenhum dos dois.

## Alternativas consideradas

- **Tenant separado do usuário (`tenantId` + membros)**: permitiria vários usuários por cliente, mas o enunciado define um usuário = um cliente. Se necessário no futuro, basta trocar a origem do `clientId` de `uid` para um custom claim; o formato dos documentos não muda.
- **Escrita de mensagens direto pelo front**: menos latência e sem cold start, mas o controle de status, de destinatários e do histórico ficaria espalhado entre rules e cliente, sem garantia de consistência.
- **Só `recipients{}`, sem `contactIds[]`**: o Firestore não consulta chaves de mapa com um operador equivalente a `array-contains`; exigiria um índice por contato.

## Consequências

- Todo documento repete `clientId` e toda query o inclui; os índices compostos começam por `clientId`.
- Validar a conexão referenciada nas rules custa uma leitura extra (`get()`) por escrita de contato.
- Operações em mensagens têm a latência de uma callable (e cold start eventual), trocada por consistência garantida no servidor.
- Exclusões em cascata são responsabilidade do backend; as rules negam `delete` direto de conexões e contatos.
