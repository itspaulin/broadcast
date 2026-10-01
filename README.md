# Broadcast

[![CI](https://github.com/itspaulin/broadcast/actions/workflows/ci.yml/badge.svg)](https://github.com/itspaulin/broadcast/actions/workflows/ci.yml)

Aplicação SaaS multi-tenant de Broadcast (teste prático — Desenvolvedor Full Stack).
Cada usuário cadastrado é um cliente, com suas próprias conexões, contatos e mensagens.
O envio de mensagens é simulado; mensagens agendadas passam para **Enviada** automaticamente via Cloud Functions.

## Funcionalidades

- **Autenticação**: cadastro e login com e-mail e senha.
- **Conexões**: criar, renomear e excluir. Excluir remove em cascata os contatos e as mensagens da conexão, mostrando antes o que será apagado.
- **Contatos** (por conexão): criar, editar, buscar e excluir, com telefone validado e normalizado. Excluir um contato avisa quais mensagens agendadas serão afetadas.
- **Broadcast** (por conexão):
  - escolher um ou mais contatos, com busca e "selecionar todos";
  - enviar agora ou agendar para uma data e hora futuras, no fuso do usuário;
  - lista em tempo real, com filtro entre agendadas e enviadas;
  - editar e excluir mensagens agendadas; mensagens enviadas podem ter o texto corrigido por 15 minutos e ficam marcadas como "editado";
  - contagem regressiva do envio e status por destinatário (enviado, entregue, lido).
- Layout responsivo, com estados de carregamento, vazio e erro em todas as telas.

## Stack

- **Web** (`/web`): React 19, TypeScript, Vite, Material UI, Tailwind CSS v4, React Router, React Hook Form
- **Backend** (`/functions`): Firebase Cloud Functions v2 (TypeScript), empacotadas com tsup
- **Compartilhado** (`/shared`): tipos, schemas zod e regras de domínio usados pelo front e pelas functions
- **Firebase**: Authentication, Firestore (tempo real), Hosting
- **Qualidade**: oxlint, TypeScript estrito, vitest, emuladores do Firebase, GitHub Actions

## Estrutura

```
.
├── docs/decisions/       # ADRs
├── functions/            # Cloud Functions
│   └── src/
│       ├── auth/         # trigger de criação de usuário
│       ├── connections/  # exclusão em cascata
│       ├── contacts/     # exclusão com ajuste das mensagens agendadas
│       ├── messages/     # criar, editar, excluir e envio agendado
│       └── lib/          # autenticação, validação e helpers do Firestore
├── shared/               # Tipos, schemas zod e regras de domínio (web + functions)
├── tests/                # Testes unitários, de Security Rules e das functions
├── web/                  # Frontend (Vite)
│   └── src/
│       ├── app/          # rotas, layout e tema
│       ├── components/   # componentes reutilizáveis
│       ├── features/     # auth, connections, contacts, messages
│       └── lib/          # Firebase, hooks de tempo real e formatação
├── firebase.json
├── firestore.rules       # Isolamento entre clientes
└── firestore.indexes.json
```

O código segue o paradigma funcional: componentes e hooks de função, functions como funções exportadas e regras de domínio como funções puras, sem classes.

As mesmas regras valem nos dois lados porque vêm do mesmo lugar: o schema que valida o formulário no front é o que valida a entrada da callable, e a janela de edição que esconde o botão "Editar texto" é a que a function usa para recusar a edição.

## Modelagem e isolamento

Sem subcoleções: todas as coleções ficam na raiz (`clients`, `connections`, `contacts`, `messages`, `messageRevisions`) e cada documento carrega `clientId` (= `uid` do Firebase Auth).

- As Security Rules só autorizam leitura e escrita quando `clientId == request.auth.uid`; toda query do front filtra por `clientId`.
- Conexões e contatos são escritos pelo front e validados pelas rules.
- Mensagens são lidas em tempo real pelo front, mas criadas, editadas e excluídas só por Cloud Functions (callables), que controlam status, destinatários e histórico.

Detalhes, alternativas e consequências: [ADR 0001](docs/decisions/0001-modelagem-e-isolamento.md).

## Agendamento

Uma função `onSchedule` roda a cada minuto, busca mensagens com `status == 'scheduled'` e `scheduledAt <= now` em páginas de 500 e marca cada uma como `sent`.
Cada escrita leva a precondição `lastUpdateTime`: uma mensagem editada ou excluída no meio da execução não é sobrescrita, e execuções repetidas não enviam a mesma mensagem duas vezes.
Requer o plano **Blaze** do Firebase.

Detalhes do ciclo de vida das mensagens e alternativas: [ADR 0002](docs/decisions/0002-ciclo-de-vida-das-mensagens.md).

## Status por destinatário

O envio é simulado, então o progresso de cada destinatário (enviado → entregue → lido) é calculado de forma determinística a partir do horário de envio e dos ids da mensagem e do contato, sem escritas no banco.
Qualquer dispositivo mostra o mesmo resultado. Detalhes: [ADR 0003](docs/decisions/0003-status-por-destinatario-simulado.md).

## Tempo real

Toda leitura do front usa `onSnapshot`: conexões, contatos e mensagens aparecem, mudam e somem sem recarregar a página, inclusive quando a mudança vem do backend (uma agendada que passa a enviada).
Cada conexão mantém uma assinatura de contatos e uma de mensagens; filtros, contagens e ordenação são derivados no cliente a partir delas.

## Testes

| Suíte | O que cobre |
| ----- | ----------- |
| Unitários (`test:unit`) | Regras de domínio do `shared` (janela de edição, schemas, datas, status por destinatário) e funções puras do front (ordenação, filtros, resumos, formatação) |
| Security Rules (`test:rules`) | Isolamento entre clientes: leitura e escrita cruzadas, troca de `clientId`, escrita direta em mensagens, status forçado |
| Functions (`test:functions`) | Callables de ponta a ponta nos emuladores (autenticação, validação, acesso a dados de outro cliente) e o envio agendado (idempotência, execuções sobrepostas, mensagem alterada no meio da execução) |

As três suítes rodam no CI a cada pull request e são obrigatórias para o merge.

## Rodando localmente

Pré-requisitos: Node 22+ e JDK 21+ (exigido pelos emuladores do Firebase). A Firebase CLI vem como dependência do projeto.

```bash
npm install
cp web/.env.example web/.env   # preencher com as credenciais do app web do Firebase
npm run dev
```

`npm run dev` sobe juntos o build em watch das functions, os emuladores (Auth, Firestore, Functions) e o Vite.
Como o emulador de Functions não dispara funções agendadas, o `dev` também roda um processo que executa a mesma lógica de envio a cada minuto contra o emulador do Firestore.
Os dados dos emuladores são persistidos em `.emulator-data/` ao encerrar.

Com `VITE_USE_EMULATORS=true` em `web/.env`, o front usa os emuladores; com `false`, o projeto real.

| Script              | O que faz                                   |
| ------------------- | ------------------------------------------- |
| `npm run dev`       | Functions (watch) + emuladores + web        |
| `npm run emulators` | Apenas os emuladores                        |
| `npm run typecheck` | Typecheck de `shared`, `web` e `functions` |
| `npm run lint`      | oxlint em todo o repo (warnings falham)     |
| `npm run build`     | Build de `web` e `functions`                |
| `npm run test:unit` | Testes unitários das regras de domínio (`shared`) e das funções puras do front |
| `npm run test:rules` | Testes das Security Rules no emulador do Firestore |
| `npm run test:functions` | Testes das callables e do agendador nos emuladores (Auth, Firestore, Functions) |

## Deploy

Pré-requisitos no projeto do Firebase: plano Blaze, Firestore criado (região `southamerica-east1`) e Authentication com e-mail e senha habilitado.

```bash
npx firebase login
npx firebase deploy
```

O deploy publica as Security Rules, os índices, as functions e o front (Hosting), fazendo o build de cada parte antes.

## Limitações e escala

O que foi deixado de fora, e o que mudaria com mais volume:

- **Envio simulado**: nenhuma mensagem sai de fato. Com um provedor real, o envio aconteceria na function que hoje só muda o status, e as confirmações de entrega e leitura chegariam por webhook (ver [ADR 0003](docs/decisions/0003-status-por-destinatario-simulado.md)).
- **Precisão do agendamento**: a varredura roda a cada minuto, então uma mensagem pode sair até cerca de um minuto depois do horário. Para horário exato, a alternativa é uma tarefa por mensagem no Cloud Tasks (ver [ADR 0002](docs/decisions/0002-ciclo-de-vida-das-mensagens.md)).
- **Vazão do agendador**: cada execução processa páginas de 500 mensagens até esvaziar a fila ou atingir o tempo limite da function; o que sobrar fica para a execução seguinte. Com volume alto, o próximo passo é particionar a varredura (por cliente ou por faixa de horário) em execuções paralelas.
- **Listas sem paginação**: contatos e mensagens de uma conexão são carregados inteiros e filtrados no cliente. Funciona bem para centenas de itens; para milhares, a lista de mensagens passaria a paginar por cursor e a busca de contatos iria para o servidor.
- **Até 500 destinatários por mensagem**: os destinatários ficam dentro do documento da mensagem, limitado a 1 MiB. Listas maiores pediriam uma coleção própria de destinatários.
- **Exclusão em cascata síncrona**: excluir uma conexão apaga contatos, mensagens e revisões dentro da chamada, em lotes. Conexões muito grandes deveriam ser apagadas por uma tarefa em segundo plano.
- **Um usuário por cliente**: `clientId` é o `uid`. Vários usuários por cliente exigiriam trocar a origem do `clientId` para um custom claim; o formato dos documentos não muda (ver [ADR 0001](docs/decisions/0001-modelagem-e-isolamento.md)).
- **Só telefones do Brasil**, armazenados em E.164.
- **Sem App Check e sem limite de requisições por cliente**, que seriam necessários antes de um uso real.

## Decisões

- [ADR 0001 — Modelagem de dados e isolamento entre clientes](docs/decisions/0001-modelagem-e-isolamento.md)
- [ADR 0002 — Ciclo de vida das mensagens e envio agendado](docs/decisions/0002-ciclo-de-vida-das-mensagens.md)
- [ADR 0003 — Status por destinatário simulado](docs/decisions/0003-status-por-destinatario-simulado.md)
