# Architecture

This document explains how UM6P Rackets is built: the services, how they talk to each other, and the main flows. For the data model see [DATABASE.md](DATABASE.md), for the endpoints see [API.md](API.md), and for the setup see [DEV.md](DEV.md).

## 1. Overview

UM6P Rackets is a set of small services behind a single HTTPS entry point. The browser only talks to **nginx**. nginx sends page requests to the **frontend** and API requests to the **api-gateway**. The gateway is the only backend app that is reachable from outside. It forwards each request to the right service through **RabbitMQ**.

```
Browser --HTTPS--> nginx --> frontend (Next.js)
                       \--> api-gateway --AMQP--> RabbitMQ --> auth-service
                                                          \--> club-service
                                                          \--> notification-service
                                                    each service --> its own PostgreSQL schema
```

## 2. Containers

| Container | Role | Public |
|---|---|---|
| `nginx` | HTTPS entry point (self-signed certificate in local runs), reverse proxy | yes, port 443 |
| `frontend` | Next.js app (SSR, UI) | no, behind nginx |
| `api-gateway` | REST API, authentication check, Socket.IO server, request routing to services | no, behind nginx |
| `auth-service` | users, login, tokens, Google OAuth, password reset | no |
| `club-service` | clubs, members, join requests, sessions, matches, leaderboard, announcements, documents, achievements, admin statistics | no |
| `notification-service` | notification inbox, live push events | no |
| `rabbitmq` | message broker between the gateway and the services | internal (port 5672 is also published for local debugging) |
| `database` | PostgreSQL, one schema per service | internal (port 5432 is also published for local debugging) |
| `*-migrate`, `*-seed` | run once (Prisma migrations, demo data) and exit | no |

## 3. Code organization

The backend is a NestJS monorepo with four apps: `api-gateway`, `auth-service`, `club-service`, `notification-service`. A shared library, `libs/contracts`, holds the message patterns and the TypeScript types for the data that goes through RabbitMQ. This means the gateway and the services share one definition of every message, and a change to a contract is visible to both sides at compile time.

The frontend is a separate Next.js app. It calls the API through the `/api/v1` prefix (`NEXT_PUBLIC_API_PREFIX`).

## 4. Communication

**Frontend to backend.** The frontend calls the gateway over HTTPS with REST. The gateway validates the input, checks the user and the role, and then talks to the services.

**Gateway to services.** Two kinds of messages go through RabbitMQ:
- **Request/reply:** the gateway sends a message and waits for the answer (for example, "list the members of this club"). The service replies with data or an error.
- **Events:** a service publishes a fact and does not wait (for example, "a user asked to join a club"). Other services react to it. The notification service uses events to create notifications.

**Errors.** A service returns a typed error, and the gateway maps it to the matching HTTP status code (not found, forbidden, conflict, and so on), so the frontend always gets a clean HTTP response.

**Real time.** The Socket.IO server runs inside the gateway. When the notification service has a new notification for a user, the gateway pushes it to that user's socket.

## 5. Data

There is one PostgreSQL database with one schema per service (`auth_schema`, `club_schema`, `notification_schema`).
- Each service connects with its own database role, which can only access its own schema.
- A service never reads another service's tables.
- A `user_id` that points to a user from another service is a plain id, not a foreign key. When a service needs user data (for example the author of an announcement), it asks the auth service through RabbitMQ and merges the result into the response.
- Every service uses Prisma, with committed migrations and a seed.

Details: [DATABASE.md](DATABASE.md).

## 6. Security

- **Passwords:** hashed with argon2.
- **Tokens:** a short-lived JWT access token (`JWT_ACCESS_EXPIRES_IN`, 15 minutes by default) and a refresh token, both in `httpOnly` cookies, so JavaScript cannot read them.
- **Refresh rotation:** each refresh token is used once and replaced. Refresh tokens are stored only as SHA-256 hashes. If a token that was already used comes back, the reuse is detected.
- **Google sign-in:** OAuth 2.0 authorization code flow with PKCE, `state` and `nonce`.
- **Roles:** admin, coach, leader and member. The gateway and the services check the role on every request, not only in the interface.
- **Network:** only nginx is public. The services are only reachable from inside the Docker network.
- **Secrets:** passwords and keys are never in the repository or in `.env`. They live in `secrets/` (one file per secret) and are given to the containers as Docker secrets.
- **Input validation:** every request body, query and parameter is validated on the backend (the frontend also validates with Zod, for a better user experience only).

## 7. Main flows

### Login and refresh
1. The browser sends the email and password to `POST /api/v1/auth/login`
2. The gateway asks `auth-service` to verify them.
3. `auth-service` returns the user, an access token and a refresh token.
4. The gateway sets both tokens as `httpOnly` cookies.
5. When the access token expires, the frontend calls the refresh endpoint. The old refresh token is replaced by a new one.

### Request to join a club (with a notification)
1. A user sends a join request. The gateway forwards it to `club-service`, which saves it in `club_schema`.
2. `club-service` publishes an event.
3. `notification-service` receives the event, stores a notification for each leader of the club, and publishes a push event.
4. The gateway sends the push to the leaders who are connected over Socket.IO.
5. When a leader accepts or rejects the request, the same path notifies the user.

### Booking a session
1. A member books a spot. The gateway forwards the request to `club-service`.
2. The service takes the session row with a lock in one transaction, checks that a spot is left, and saves the booking. Two users who take the last spot at the same time cannot both succeed.

See [SESSIONS.md](SESSIONS.md) for the full sessions design.

## 8. Deployment

Everything runs with Docker Compose, started by the root `Makefile` (`make`). The start order is: `database` and `rabbitmq`, then the `*-migrate` and `*-seed` jobs, then the services, then the gateway, the frontend and nginx. The database and RabbitMQ data are kept in `~/data/database` and `~/data/rabbitmq`.

Configuration comes from `.env` (not secret, see `.env.example`) and from `secrets/` (secret).

## 9. Design decisions

| Decision | Why |
|---|---|
| Microservices with one public gateway | each service has one job, and the attack surface is small |
| RabbitMQ between services | loose coupling, request/reply and events with one tool |
| One schema per service, no cross-service foreign keys | a service owns its data and can change it without breaking the others |
| JWT in `httpOnly` cookies | the tokens cannot be stolen by a script injected in the page |
| Shared `libs/contracts` | one definition of every message for the gateway and the services |
| Prisma | typed queries and versioned migrations |