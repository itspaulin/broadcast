# Broadcast

[![CI](https://github.com/itspaulin/broadcast/actions/workflows/ci.yml/badge.svg)](https://github.com/itspaulin/broadcast/actions/workflows/ci.yml)

Aplicação SaaS multi-tenant de Broadcast (teste prático — Desenvolvedor Full Stack).
Cada usuário cadastrado é um cliente, com suas próprias conexões, contatos e mensagens.
O envio de mensagens é simulado; mensagens agendadas passam para **Enviada** automaticamente via Cloud Functions.

## Stack

- **Web** (`/web`): React 19, TypeScript, Vite, Material UI, Tailwind CSS v4
- **Backend** (`/functions`): Firebase Cloud Functions v2 (TypeScript)
- **Firebase**: Authentication, Firestore (tempo real), Hosting

## Estrutura

```
.
├── docs/decisions/       # ADRs
├── functions/            # Cloud Functions
├── shared/               # Tipos, schemas zod e regras de domínio (web + functions)
├── web/                  # Frontend (Vite)
├── firebase.json
├── firestore.rules       # Isolamento entre clientes
└── firestore.indexes.json
```

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
| `npm run test:rules` | Testes das Security Rules no emulador do Firestore |
| `npm run test:functions` | Testes das callables e do agendador nos emuladores (Auth, Firestore, Functions) |

## Deploy

```bash
npx firebase login
npx firebase deploy
```
