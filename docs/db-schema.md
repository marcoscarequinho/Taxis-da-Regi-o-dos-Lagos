# Modelagem de Dados — Taxis da Região dos Lagos

PostgreSQL via Prisma (`apps/backend/prisma/schema.prisma`). Geolocalização em tempo real (posição de motoristas online) fica no **Redis** (`GEOADD`/`GEOSEARCH`, chave `drivers:online`), não no Postgres — é efêmera por natureza e não precisa de persistência relacional.

## Diagrama ER

```mermaid
erDiagram
    User ||--o| DriverProfile : "1:1 (opcional)"
    DriverProfile ||--o{ Vehicle : possui
    User ||--o{ Ride : "solicita (passageiro)"
    User ||--o{ Ride : "atende (motorista)"
    Ride ||--o| Payment : gera
    Ride ||--o{ Rating : recebe
    User ||--o{ Rating : "dá/recebe"

    User {
        string id PK
        string name
        string email UK
        string phone UK
        string passwordHash
        bool isDriver
        bool isPassenger
        string avatarUrl
        datetime createdAt
    }

    DriverProfile {
        string userId PK_FK
        string cnhNumber
        string cnhDocUrl
        enum backgroundCheckStatus
        bool isOnline
        float ratingAvg
        string mpUserId "Mercado Pago collector_id (OAuth)"
        string mpAccessToken
        string mpRefreshToken
        datetime mpConnectedAt
    }

    Vehicle {
        string id PK
        string driverId FK
        string plate UK
        string model
        string color
        int year
    }

    Ride {
        string id PK
        string passengerId FK
        string driverId FK "nullable"
        enum status
        float originLat
        float originLng
        string originAddress
        float destinationLat
        float destinationLng
        string destinationAddress
        float distanceKm
        float durationMin
        float estimatedFare
        float finalFare
        enum paymentMethod "somente PIX"
        string routePolyline
        datetime requestedAt
        datetime acceptedAt
        datetime startedAt
        datetime completedAt
        datetime cancelledAt
    }

    Payment {
        string id PK
        string rideId FK UK
        float amount
        enum method
        enum status
        string providerTransactionId
        datetime paidAt
    }

    Rating {
        string id PK
        string rideId FK
        string fromUserId FK
        string toUserId FK
        int score
        string comment
    }
```

## Notas de modelagem

- **`User` unificado**: um único registro de usuário pode ser passageiro (`isPassenger`, sempre `true`) e/ou motorista (`isDriver`), consistente com a decisão de app único com dois modos. Trocar de modo no app é uma decisão puramente client-side; o backend apenas valida se `isDriver` permite entrar no modo motorista (`POST /users/me/mode`).
- **`DriverProfile.mpUserId/mpAccessToken/mpRefreshToken`**: preenchidos após o motorista concluir o OAuth Connect do Mercado Pago. `mpAccessToken`/`mpRefreshToken` nunca são expostos pela API (`UsersService` os remove antes de devolver o perfil) — apenas `mpConnected: boolean` é exposto ao cliente.
- **`Ride.paymentMethod`**: o enum Prisma mantém `PIX | CARD | CASH` por flexibilidade futura, mas a aplicação hoje força sempre `PIX` na criação da corrida (decisão do negócio: split automático de 80/20 só é viável via Pix/Mercado Pago).
- **Split financeiro**: não há uma tabela de "repasses" separada — o split (80% motorista / 20% plataforma) acontece **dentro do próprio pagamento Mercado Pago** (campo `disbursements` da API), então o valor líquido do motorista é sempre `Payment.amount * 0.8` e não precisa de uma segunda transação registrada no nosso banco.
- **Índices**: `Ride` tem índices em `passengerId`, `driverId` e `status` (consultas de histórico e de matching). `Vehicle.plate` e `User.email`/`User.phone` são únicos.
- **Neon/Postgres**: se usar o pooler do Neon (`-pooler` no host) para `DATABASE_URL`, `prisma migrate dev` normalmente funciona, mas se houver erro de *prepared statements*, configure uma `DIRECT_URL` (conexão direta, sem pooler) no `datasource db` do `schema.prisma` apenas para migrations.

## Diagrama de estados de `Ride.status`

```
REQUESTED → SEARCHING → ACCEPTED → ARRIVED → IN_PROGRESS → COMPLETED
                 └──────────────┴────────────┴──────────────┘
                                 CANCELLED (a qualquer momento antes de COMPLETED)
```
