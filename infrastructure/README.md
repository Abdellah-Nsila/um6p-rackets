# Infrastructure

The Docker images of the three infrastructure services. Each folder is the build context of one service in `docker-compose.yml`.

| Folder | Service | Role |
|---|---|---|
| `database/` | PostgreSQL | one database with one schema and one role per service (auth, club, notification), created at the first start |
| `rabbitmq/` | RabbitMQ | the message broker between the gateway and the services |
| `nginx/` | nginx | the HTTPS entry point: sends the pages to the frontend and the API requests to the gateway |

## Database

- The database name, the roles and the schemas come from the root `.env`, and the passwords from the files in `secrets/`.
- The data is stored in `~/data/database` on the host, so it survives `make down` and `make clean`.
- Port 5432 is published for local debugging.
- Health check: `pg_isready`.

## RabbitMQ

- The user comes from `.env` (`RABBITMQ_USER`) and the password from `secrets/rabbitmq_password.txt`.
- The data is stored in `~/data/rabbitmq` on the host.
- Port 5672 (AMQP) is published for local debugging.
- Health check: `rabbitmq-diagnostics ping`.

## nginx

- It is the only service reachable from outside, on port **443** (HTTPS).
- The certificate is self-signed, so the browser shows a warning that you must accept.
- It starts after the gateway is healthy and the frontend is started.

## See also

- [ARCHITECTURE.md](../docs/ARCHITECTURE.md): how the pieces fit together
- [DEV.md](../docs/DEV.md): commands, start order and troubleshooting