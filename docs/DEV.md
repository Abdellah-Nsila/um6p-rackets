# Developer guide

How to run, rebuild, debug and extend the project. For the first run, follow the [README](../README.md). For the design, see [ARCHITECTURE.md](ARCHITECTURE.md).

## 1. Repository layout

```
ft_transcendence/
├── README.md
├── .env.example            non-secret configuration (copy it to .env)
├── Makefile                the commands to run everything
├── docker-compose.yml      all the containers
├── docs/                   ARCHITECTURE, DATABASE, API, MODULES, SESSIONS, DEV
├── infrastructure/         one Dockerfile folder each: database, rabbitmq, nginx
├── backend/                NestJS monorepo
│   ├── apps/               the four apps: api-gateway, auth-service, club-service, notification-service
│   ├── libs/               shared code: contracts (messages and types), common (helpers, constants, dates)
│   └── Dockerfile          one file for all apps, see below
├── frontend/               Next.js app (Tailwind CSS, shadcn/ui)
└── secrets/                one file per secret (ignored by Git)
```

- Each backend service that has a database has its own `prisma/schema.prisma` (auth, club, notification).
- The backend Dockerfile is shared. The build argument `APP_NAME` chooses the app, and the build targets `migrate` and `seed` build the one-shot containers that apply the Prisma migrations and the demo data.
- Tools: NestJS with Vitest (unit and e2e configs), oxlint and Prettier on the backend. Next.js with ESLint and Prettier on the frontend. The scripts of each side are in its `package.json`.
- The frontend has its own notes in `frontend/CONVENTIONS.md`.

## 2. Configuration

| Where | What | In Git |
|---|---|---|
| `.env` | non-secret values (users, schema names, URLs, SMTP host). Copy from `.env.example` | no |
| `secrets/*.txt` | passwords and keys, one file per secret | no |
| `docker-compose.yml` | gives each service only the variables and secrets it needs | yes |

Secrets are never put in environment variables directly. Compose mounts each file in the container under `/run/secrets/`, and the service reads it through a variable that ends with `_FILE` (for example `DB_PASSWORD_FILE`).

Who receives which secret:

| Secret file | Receivers |
|---|---|
| `db_password.txt` | database |
| `auth_service_password.txt` | database, auth-service |
| `club_service_password.txt` | database, club-service |
| `notification_service_password.txt` | database, notification-service |
| `rabbitmq_password.txt` | rabbitmq, api-gateway, auth-service, club-service, notification-service |
| `jwt_access_secret.txt` | api-gateway, auth-service |
| `google_client_id.txt`, `google_client_secret.txt` | api-gateway |
| `smtp_password.txt` | auth-service |

Two frontend values are read at **build time**: `NEXT_PUBLIC_API_URL` (taken from `FRONTEND_URL`) and `NEXT_PUBLIC_API_PREFIX`. If you change one of them in `.env`, rebuild the frontend (section 4).

## 3. Containers and start order

| Compose service | Container | Notes |
|---|---|---|
| `database` | `database` | PostgreSQL, port 5432 published, data in `~/data/database` |
| `rabbitmq` | `rabbitmq` | port 5672 published, data in `~/data/rabbitmq` |
| `api_gateway` | `api-gateway` | listens on port 3010 inside the network, not published |
| `auth` | `auth-service` | |
| `club` | `club-service` | |
| `notification` | `notification-service` | |
| `frontend` | `frontend` | |
| `nginx` | `nginx` | the only public entry point, port 443 |
| `auth_migrate`, `club_migrate`, `notification_migrate` | `*-migrate` | run once, then exit |
| `auth_seed`, `club_seed`, `notification_seed` | `*-seed` | run once, then exit |

Start order, defined with `depends_on` and health checks:
1. `database` and `rabbitmq` start first. Their health checks (`pg_isready` and `rabbitmq-diagnostics ping`) must pass.
2. Each `*_migrate` container waits for the database and applies the migrations of its service.
3. Each `*_seed` container waits for its migration and adds the demo data.
4. `auth`, `club` and `notification` wait for RabbitMQ, the database and the end of their own migration.
5. `api_gateway` only waits for RabbitMQ. Its health check calls `/api/v1/auth/health`.
6. `frontend` waits for a healthy gateway, and `nginx` waits for a healthy gateway and the started frontend.

## 4. Daily commands

All the commands run from the root of the repository.

| Command | What it does |
|---|---|
| `make` | creates `~/data/database` and `~/data/rabbitmq`, builds each image one by one (a failed build is retried once with `--no-cache`), then starts everything |
| `make up` | creates the folders and runs `docker compose up -d`. Compose rebuilds the images whose files changed, using the Docker cache |
| `make stop` / `make start` | stop and restart the existing containers, without rebuilding |
| `make down` | stop and remove the containers |
| `make status` | `docker ps` (all the containers of the machine) |
| `make clean` | `down`, then remove the Compose volumes and orphan containers |
| `make fclean` | `clean`, then delete `~/data/*` (with `sudo`), then **delete all the Docker images, volumes and build cache of the machine**, then restart Docker |
| `make re` | `fclean`, then `make` |

**Warning:** `make fclean` and `make re` do not only clean this project. They remove every Docker image, volume and cache of the machine.

### Rebuild one service
After changing the code of one service, you do not need to rebuild everything:
```bash
docker compose -f ./docker-compose.yml build club
docker compose -f ./docker-compose.yml up -d club
```
Replace `club` with the Compose service name from the table above (`api_gateway`, `auth`, `club`, `notification`, `frontend`, `nginx`).

### Start again with an empty database
The data lives in a folder of your machine (`~/data/database`) that is mounted in the container. `make clean` removes the Compose volumes, but it **keeps the files of that folder**, so the old data comes back. To really start from zero:
```bash
make clean
sudo rm -rf ~/data/database ~/data/rabbitmq
make
```
The migrations and the seed run again at startup.

## 5. Debugging

Logs:
```bash
docker logs -f club-service            # one container, follow
docker compose -f ./docker-compose.yml logs -f club auth   # several services
docker logs auth-migrate               # why a migration failed
```

Database (the user is `DB_USER` from `.env`, the database is `DB_NAME`):
```bash
docker exec -it database psql -U admin -d rackets_db
\dn                                    # list the schemas
\dt club_schema.*                      # list the tables of a schema
```

RabbitMQ queues:
```bash
docker exec rabbitmq rabbitmqctl list_queues
```

## 6. Adding a feature

The team works with the contract first:
1. Write the endpoint in the API contract (see [API.md](API.md)), and agree on it with the people on the other side (frontend or backend).
2. Add the message pattern and the types in `backend/libs/contracts`, so the gateway and the service share them.
3. Implement the handler in the service, and the route in the `api-gateway`. The gateway validates the input and checks the role.
4. If a table changes, edit the `schema.prisma` of that service and add a Prisma migration. The `*-migrate` container applies it at startup.
5. Build the page or the component in the frontend, with the types of the contract.
6. Update [API.md](API.md) and, if the tables changed, [DATABASE.md](DATABASE.md).

Rules to keep:
- A service never reads the tables of another service. Ask it through RabbitMQ.
- A `user_id` from the auth service is a plain id, not a foreign key.
- Check the role in the backend, not only in the interface.
- Never commit `.env` or anything in `secrets/`.

## 7. Troubleshooting

| Problem | Cause and fix |
|---|---|
| `make` fails because a port is used | Ports 443, 5432 and 5672 must be free. Stop a local PostgreSQL, RabbitMQ or web server |
| The browser shows a certificate warning | The certificate is self-signed. Accept it to continue |
| An image fails to build | `make` already retries it once without cache. Run `make` again, and read the error of that image |
| A service restarts again and again | Read `docker logs <container>`. Most of the time a secret file is missing or empty, or a migration failed (`docker logs <service>-migrate`) |
| The frontend calls the wrong address | `NEXT_PUBLIC_API_URL` and `NEXT_PUBLIC_API_PREFIX` are baked in at build time. Change `.env`, then rebuild the `frontend` service |
| Google sign-in or the password reset email fails | These need your own Google keys and SMTP key in `secrets/`. Everything else works without them |
| Old data after `make clean` | The data folder is kept. See "Start again with an empty database" |