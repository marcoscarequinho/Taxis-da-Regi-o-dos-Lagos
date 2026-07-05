# Taxis da Região dos Lagos

App de transporte por aplicativo (passageiro + motorista, um único app com dois modos), com rastreamento em tempo real, matching por proximidade e pagamento Pix com split automático (Mercado Pago).

## Estrutura

```
apps/backend   → NestJS + Prisma + PostgreSQL + Redis + Socket.io
apps/mobile    → Expo (React Native) — passageiro e motorista
packages/shared → Tipos/DTOs compartilhados entre backend e mobile
docs/          → api.md, db-schema.md, roadmap.md
```

## Pré-requisitos

- Node.js 20+, pnpm 10+
- Docker (para Postgres + Redis locais) — ou um Postgres/Redis já provisionados (ex.: Neon)
- Conta Google Cloud com Maps Platform habilitado (Directions, Places, Geocoding)
- Conta Mercado Pago com aplicativo criado (Client ID/Secret + Access Token) e **Split de Pagamentos** habilitado

## Configuração

1. `apps/backend/.env` — copie de `.env.example` e preencha `DATABASE_URL`, `GOOGLE_MAPS_API_KEY`, `MERCADO_PAGO_*`. Cadastre a `MERCADO_PAGO_OAUTH_REDIRECT_URI` no painel do app Mercado Pago (developers.mercadopago.com).
2. `apps/mobile/.env` — copie de `.env.example` e ajuste `EXPO_PUBLIC_API_URL`/`EXPO_PUBLIC_SOCKET_URL` para o IP da máquina rodando o backend (necessário para testar em dispositivo físico).
3. `apps/mobile/app.json` — troque `REPLACE_WITH_IOS_GOOGLE_MAPS_API_KEY` / `REPLACE_WITH_ANDROID_GOOGLE_MAPS_API_KEY` pelas chaves do Google Maps (essas ficam client-side, então use chaves restritas por bundle id/SHA).

## Rodando localmente

```bash
pnpm install

# Se não usar um Postgres/Redis externo (ex.: Neon):
pnpm docker:up

pnpm prisma:migrate      # cria as tabelas
pnpm backend:dev         # inicia o backend em http://localhost:3000

pnpm mobile:start        # abre o Expo (Expo Go, emulador Android/iOS ou web)
```

Para testar o fluxo completo é preciso dois dispositivos/emuladores logados com contas diferentes: um em modo passageiro solicitando corrida, outro em modo motorista (após cadastro + conexão Mercado Pago) recebendo a oferta.

## Documentação

- [`docs/api.md`](docs/api.md) — endpoints REST e eventos WebSocket
- [`docs/db-schema.md`](docs/db-schema.md) — modelo de dados (diagrama ER)
- [`docs/roadmap.md`](docs/roadmap.md) — fases MVP → V1 → V2
