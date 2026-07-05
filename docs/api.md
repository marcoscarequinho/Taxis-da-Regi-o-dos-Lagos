# API — Taxis da Região dos Lagos

Base URL (dev): `http://localhost:3000`

Todas as rotas (exceto `auth/*`, `drivers/mercadopago/callback` e `payments/webhook/mercadopago`) exigem o header:

```
Authorization: Bearer <accessToken>
```

## Tipo `GeoPoint`

Usado em `origin`/`destination` de `rides` e `geo`. Aceita **um dos dois formatos**:

```jsonc
{ "lat": -22.87, "lng": -42.02 }      // coordenada (ex.: GPS do passageiro)
{ "placeId": "ChIJ..." }              // place_id do Google Places Autocomplete
```

O backend resolve endereço/coordenadas finais a partir da própria resposta do Google Directions (`start_address`/`end_address`/`start_location`/`end_location`), então não é necessária uma chamada extra de geocoding no cliente.

## Auth

| Método | Rota | Body | Descrição |
|---|---|---|---|
| POST | `/auth/register` | `{ name, email, phone, password, isDriver? }` | Cria usuário, retorna `{ accessToken, refreshToken }` |
| POST | `/auth/login` | `{ email, password }` | Retorna `{ accessToken, refreshToken }` |
| POST | `/auth/refresh` | `{ refreshToken }` | Renova o par de tokens |

## Usuários

| Método | Rota | Descrição |
|---|---|---|
| GET | `/users/me` | Perfil do usuário logado (inclui `driverProfile` sanitizado, sem tokens) |
| PATCH | `/users/me` | Atualiza `name`/`avatarUrl` |
| POST | `/users/me/mode` | `{ mode: "passenger" \| "driver" }` — valida se pode entrar no modo motorista |

## Motoristas

| Método | Rota | Body | Descrição |
|---|---|---|---|
| POST | `/drivers/documents` | `{ cnhNumber, cnhDocUrl }` | Cria o `DriverProfile` e marca `user.isDriver = true` |
| PATCH | `/drivers/status` | `{ isOnline, lat?, lng? }` | Liga/desliga disponibilidade; grava posição no Redis GEO |
| GET | `/drivers/me/earnings` | — | Totais e histórico de ganhos (bruto, comissão, líquido) |
| GET | `/drivers/mercadopago/connect-url` | — | Retorna `{ url }` para o motorista autorizar via OAuth |
| GET | `/drivers/mercadopago/callback` | — (público) | Callback do OAuth Mercado Pago; salva `mpUserId`/tokens |

## Veículos

| Método | Rota | Body |
|---|---|---|
| POST | `/vehicles` | `{ plate, model, color, year }` |
| GET | `/vehicles/me` | — |

## Geo (proxy Google Maps)

| Método | Rota | Query/Body |
|---|---|---|
| GET | `/geo/autocomplete` | `?input=&sessionToken=` → `[{ placeId, description }]` |
| POST | `/geo/directions` | `{ origin: GeoPoint, destination: GeoPoint }` → distância/duração/polyline/endereços resolvidos |

## Corridas

| Método | Rota | Body | Descrição |
|---|---|---|---|
| POST | `/rides/estimate` | `{ origin, destination }` | Estimativa de distância/tempo/valor antes de confirmar |
| POST | `/rides` | `{ origin, destination }` | Cria a corrida (status `SEARCHING`) e dispara o matching em background |
| GET | `/rides/history` | — | Corridas do usuário (passageiro ou motorista) |
| GET | `/rides/:id` | — | Detalhes de uma corrida (participante apenas) |
| PATCH | `/rides/:id/accept` | — | Aceite manual (fallback ao fluxo de oferta via socket) |
| PATCH | `/rides/:id/arrived` | — | Motorista chegou ao ponto de partida |
| PATCH | `/rides/:id/start` | — | Inicia a viagem |
| PATCH | `/rides/:id/complete` | — | Finaliza a corrida, grava `finalFare` e cria a cobrança (`Payment` pendente) |
| PATCH | `/rides/:id/cancel` | — | Cancela (passageiro ou motorista) |
| POST | `/rides/:id/rating` | `{ score, comment? }` | Avalia a outra parte após conclusão |

## Pagamentos (somente Pix, com split automático)

| Método | Rota | Body | Descrição |
|---|---|---|---|
| POST | `/payments/rides/:id/pay` | `{ payerEmail }` | Cria o pagamento Pix no Mercado Pago com **split automático**: 80% para a conta conectada do motorista (`disbursements`), 20% permanece na conta da plataforma. Requer que o motorista já tenha conectado o Mercado Pago. |
| POST | `/payments/webhook/mercadopago` | (payload do MP) | Endpoint público chamado pelo Mercado Pago para atualizar o status do pagamento |

### Fluxo de conexão do motorista com o Mercado Pago

1. App chama `GET /drivers/mercadopago/connect-url` e abre a URL retornada no navegador do dispositivo.
2. O motorista faz login/autoriza no Mercado Pago (conta própria, com Pix já configurado).
3. O Mercado Pago redireciona para `GET /drivers/mercadopago/callback?code=...&state=<userId>`, que troca o `code` por `access_token`/`user_id` e salva no `DriverProfile` (`mpUserId`, `mpAccessToken`, `mpRefreshToken`).
4. A partir daí, toda cobrança dessa corrida usa `disbursements: [{ collector_id: mpUserId, amount: 80% }]` — o valor cai automaticamente na conta Mercado Pago do motorista, e o restante (20%) fica com a conta da plataforma (dona do `MERCADO_PAGO_ACCESS_TOKEN`).

**Importante**: a URL de redirect (`MERCADO_PAGO_OAUTH_REDIRECT_URI`) precisa estar cadastrada no painel do aplicativo Mercado Pago (developers.mercadopago.com) para o OAuth funcionar.

## WebSocket — namespace `/realtime`

Conexão: `io("<API_URL>/realtime", { auth: { token: accessToken } })`

| Evento | Direção | Payload | Descrição |
|---|---|---|---|
| `ride:join` | cliente → servidor | `{ rideId }` | Entra na room `ride:{id}` para receber updates |
| `driver:location` | cliente → servidor | `{ lat, lng, heading?, speed?, timestamp, rideId? }` | Motorista envia posição a cada 3–5s; grava no Redis GEO e retransmite para a room da corrida se `rideId` presente |
| `ride:status` | servidor → cliente | `{ rideId, status, driverId? }` | Emitido a cada transição de status da corrida |
| `ride:offer` | servidor → **um** motorista | `RideOfferEvent` + **ack** `{ accepted }` | Oferta de corrida com timeout (configurável, padrão 15s) |
| `ride:driverLocation` | servidor → cliente | `{ rideId, lat, lng, ... }` | Retransmissão da posição do motorista para quem acompanha a corrida |

## Erros

Respostas de erro seguem o formato padrão do NestJS: `{ statusCode, message, error }`.
