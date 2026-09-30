# Broadcast

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
├── functions/            # Cloud Functions
├── shared/               # Tipos, schemas zod e regras de domínio (web + functions)
├── web/                  # Frontend (Vite)
├── firebase.json
├── firestore.rules       # Isolamento entre clientes
└── firestore.indexes.json
```

## Modelagem de dados

Sem subcoleções: todas as coleções ficam na raiz e cada documento carrega `clientId` (= `uid` do Firebase Auth).

| Coleção       | Campos principais                                                                              |
| ------------- | ---------------------------------------------------------------------------------------------- |
| `clients`     | `{uid}` → `name`, `email`, `createdAt`                                                        |
| `connections` | `clientId`, `name`, `createdAt`, `updatedAt`                                                   |
| `contacts`    | `clientId`, `connectionId`, `name`, `phone`, `createdAt`, `updatedAt`                          |
| `messages`    | `clientId`, `connectionId`, `contactIds[]`, `body`, `status` (`scheduled` \| `sent`), `scheduledAt`, `sentAt` |

## Isolamento entre clientes

Garantido pelas Security Rules do Firestore:

- Leitura e escrita somente quando `resource.data.clientId == request.auth.uid`;
- `clientId` e `connectionId` imutáveis após a criação;
- Criação de contatos e mensagens valida que a conexão referenciada pertence ao mesmo cliente;
- Toda query do frontend filtra por `clientId`, o que permite às rules autorizá-la.

## Agendamento

Uma função `onSchedule` roda a cada minuto, busca mensagens com `status == 'scheduled'` e `scheduledAt <= now` e as marca como `sent` em lote.
Requer o plano **Blaze** do Firebase.

## Rodando localmente

Pré-requisitos: Node 22+ e JDK 21+ (exigido pelos emuladores do Firebase). A Firebase CLI vem como dependência do projeto.

```bash
npm install
cp web/.env.example web/.env   # preencher com as credenciais do app web do Firebase
npm run dev
```

`npm run dev` sobe juntos o build em watch das functions, os emuladores (Auth, Firestore, Functions) e o Vite.
Os dados dos emuladores são persistidos em `.emulator-data/` ao encerrar.

Com `VITE_USE_EMULATORS=true` em `web/.env`, o front usa os emuladores; com `false`, o projeto real.

| Script              | O que faz                                   |
| ------------------- | ------------------------------------------- |
| `npm run dev`       | Functions (watch) + emuladores + web        |
| `npm run emulators` | Apenas os emuladores                        |
| `npm run typecheck` | Typecheck de `shared`, `web` e `functions` |

## Deploy

```bash
npx firebase login
npx firebase deploy
```
