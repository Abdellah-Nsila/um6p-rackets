# Backend

The backend of UM6P Rackets: a NestJS monorepo made of four apps that talk through RabbitMQ.

## Apps

| App | Role |
|---|---|
| `api-gateway` | the only public app: REST API under `/api/v1`, authentication check, Socket.IO, routing to the services (port 3010 inside the Docker network) |
| `auth-service` | users, login, tokens, Google OAuth, password reset |
| `club-service` | clubs, members, join requests, sessions, matches, leaderboard, announcements, documents, achievements |
| `notification-service` | notification inbox and live events |

## Folders

| Path | Content |
|---|---|
| `apps/` | one folder per app. Each service with a database has its own `prisma/schema.prisma` |
| `libs/contracts` | the message patterns, DTOs and types shared by the gateway and the services |
| `libs/common` | shared helpers and constants (for example the date helpers) |
| `Dockerfile` | one file for all the apps (see below) |

## Docker image

The same `Dockerfile` builds every app. The build argument `APP_NAME` chooses the app, and two extra targets build the one-shot containers:

| Target | Role |
|---|---|
| default | the running service |
| `migrate` | applies the Prisma migrations of the service |
| `seed` | adds the demo data |

## Run it

The backend is started with the rest of the project from the root of the repository:

```bash
make
```

To rebuild only one service after a change (`api_gateway`, `auth`, `club` or `notification`):

```bash
docker compose -f ./docker-compose.yml build club
docker compose -f ./docker-compose.yml up -d club
```

## Tools

NestJS, Prisma (PostgreSQL), RabbitMQ, Vitest for the tests, oxlint and Prettier. The scripts are in `package.json`.

## See also

- [ARCHITECTURE.md](../docs/ARCHITECTURE.md): services and message flows
- [DATABASE.md](../docs/DATABASE.md): the tables of each service
- [API.md](../docs/API.md): the endpoints
- [DEV.md](../docs/DEV.md): developer guide for the whole project