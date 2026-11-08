*This project has been created as part of the 42 curriculum by abnsila, ablabib, hwahmane, znajdaou.*

# UM6P Rackets

## Description

**UM6P Rackets** is a web platform that lets the racket-sport clubs of UM6P (tennis, padel, badminton, squash and table tennis) run their activity in one place.

**Goal:** make it easy for players to join a club, book training sessions, organize ranked matches and follow their progress, and for coaches and leaders to manage their club.

**Key features**
- Accounts: email and password, Google sign-in, password reset by email.
- Clubs with roles (member, leader, coach) and a join request system.
- Weekly training sessions with limited spots, booking, and week-by-week navigation.
- Matches: a member asks for a match, a leader accepts and becomes the referee, the referee enters the result.
- A leaderboard per club (points, wins, losses).
- Announcements, documents and achievements.
- Live notifications.

## Instructions

### Prerequisites
- Linux with `git`, `make` and `openssl`.
- Docker Engine and a recent Docker Compose v2 (`docker compose version`). Node.js is not needed, everything is built inside Docker.
- Free ports: `443` (the app), `5432` (PostgreSQL), `5672` (RabbitMQ).

### 1. Get the code and the configuration
```bash
git clone <repository-url> ft_transcendence
cd ft_transcendence
cp .env.example .env
```
The default values in `.env` work for a local run.

### 2. Create the secrets
Passwords and keys live in `secrets/` (one file per secret, ignored by Git). The list is at the end of `.env.example`.
```bash
mkdir -p secrets

# passwords and JWT secret: random values (hex avoids special characters in connection URLs)
for name in db_password auth_service_password club_service_password \
            notification_service_password rabbitmq_password; do
  openssl rand -hex 16 | tr -d '\n' > "secrets/$name.txt"
done
openssl rand -hex 32 | tr -d '\n' > secrets/jwt_access_secret.txt

# external services: your own keys
printf '%s' 'YOUR_GOOGLE_CLIENT_ID'     > secrets/google_client_id.txt
printf '%s' 'YOUR_GOOGLE_CLIENT_SECRET' > secrets/google_client_secret.txt
printf '%s' 'YOUR_SMTP_API_KEY'         > secrets/smtp_password.txt
```
- Google sign-in needs a Google OAuth client with `https://localhost/api/v1/auth/google/callback` as an authorized redirect URI.
- Password reset emails need a real SMTP key (we use [Resend](https://resend.com)).
- Without real values for these three files, everything else still works, but those two features fail.

### 3. Start everything (one command)
```bash
make
```
`make` creates the data folders (`~/data/database`, `~/data/rabbitmq`), builds every image, runs the database migrations and the demo seed, and starts all services. The first build takes a few minutes.

### 4. Open the app
Go to **https://localhost**. The certificate is self-signed, so the browser shows a warning: accept it to continue. Create an account from the sign-up page.

### Useful commands

| Command | What it does |
|---|---|
| `make` | folders, build, start (the full setup) |
| `make up` | start without rebuilding |
| `make status` | list the running containers |
| `make stop` / `make start` | pause and resume |
| `make down` | stop and remove the containers |
| `make clean` | `down` + remove the Docker volumes |
| `make fclean` | `clean` + delete `~/data/*` and **all Docker images, volumes and cache of the machine**, then restart Docker (needs `sudo`) |
| `make re` | `fclean` + `make` |

### Containers
`nginx` (HTTPS entry point), `frontend`, `api-gateway`, `auth-service`, `club-service`, `notification-service`, `rabbitmq`, `database`. The `*-migrate` and `*-seed` containers run once and exit.

## Technical Stack

```
Browser --HTTPS--> nginx --> frontend (Next.js)
                       \--> api-gateway --AMQP--> RabbitMQ --> auth-service
                                                          \--> club-service
                                                          \--> notification-service
                                                    each service --> its own PostgreSQL schema
```

| Layer | Technology | Why |
|---|---|---|
| Frontend | Next.js (React), tailwindcss | modern UI with utility-first CSS |
| Backend | NestJS (TypeScript), a monorepo of 4 apps | modules and dependency injection keep four services consistent, with built-in microservice support |
| Messaging | RabbitMQ | the services stay loosely coupled, and the gateway is the only public app |
| Database | PostgreSQL + Prisma ORM | relational data with constraints and transactions (for example, booking the last spot); one schema per service; typed queries and committed migrations |
| Auth | JWT in `httpOnly` cookies, rotating refresh tokens, argon2, Google OAuth (PKCE) | tokens are never readable by JavaScript, and a stolen refresh token is detected when reused |
| Real time | Socket.IO | live notifications |
| Email | SMTP (nodemailer) | password reset |
| Reverse proxy | nginx | one HTTPS entry point |
| Deployment | Docker, Docker Compose, Makefile | the whole stack starts with one command |

## Database Schema

One PostgreSQL database with **one schema per service** (`auth_schema`, `club_schema`, `notification_schema`). Each service connects with its own role and never reads another service's tables. A `user_id` that points to another service is a plain id, not a foreign key.

**club_schema** (`──<` means one-to-many):
```
clubs ──< members ──< session_attends >── sessions >── session_templates
  │          │
  │          ├──< announcements       (announcer)
  │          ├──< join_requests       (decided_by)
  │          ├──< achievements        (awarded_by)
  │          └──< teams ──< matches   (team1, team2, winner; the referee is a member)
  ├──< club_documents
  └──< leaderboard stats (leaderboard)
```

| Table | Key fields | Rules |
|---|---|---|
| `clubs` | `name`, `slug` | both unique |
| `members` | `club_id`, `user_id`, `role` (0 member, 1 leader, 2 coach), `left_at` | unique (`club_id`, `user_id`); a member who left keeps the row |
| `join_requests` | `club_id`, `user_id`, `status` (0 pending, 1 accepted, 2 rejected, 3 cancelled), `decided_by` | unique (`club_id`, `user_id`); the same row is reopened when the user asks again |
| `session_templates` | `weekday` (0 = Monday), `start_time`, `duration_minutes`, `capacity` | the weekly plan |
| `sessions` | `template_id` (nullable), `start_at`, `end_at`, `capacity`, `cancelled_at` | one real session per date, never deleted; unique (`template_id`, `start_at`) |
| `session_attends` | `session_id`, `member_id` | unique (`session_id`, `member_id`) |
| `teams` | `player1_id`, `player2_id` (null = singles) | members of the club |
| `matches` | `team1_id`, `team2_id`, `winner_id`, `ref_id`, scores and points, `mode`, `status` (0 pending, 1 confirmed, 2 finished, 3 cancelled), `scheduled_at` | the referee is set when a leader accepts |
| `announcements` | `announcer_id`, `description` | |
| `achievements` | `user_id`, `code`, `awarded_by` | unique (`club_id`, `user_id`, `code`) |

Ids are integers, dates are `timestamptz`, and statuses are small integers protected by `CHECK` constraints.

**auth_schema:** `users` and their refresh tokens (stored only as SHA-256 hashes). users

**notification_schema:** the notifications inbox with a read state. notifications

Details and the full diagrams: [docs/DATABASE.md](docs/DATABASE.md).

## Resources

**References**
- NestJS: https://docs.nestjs.com
- Prisma: https://www.prisma.io/docs
- RabbitMQ: https://www.rabbitmq.com/docs
- PostgreSQL: https://www.postgresql.org/docs/
- Next.js: https://nextjs.org/docs
- Socket.IO: https://socket.io/docs/v4/
- Docker Compose: https://docs.docker.com/compose/
- OWASP Cheat Sheet Series (authentication, session management, password storage): https://cheatsheetseries.owasp.org
- PKCE for OAuth, RFC 7636: https://datatracker.ietf.org/doc/html/rfc7636

**How AI was used**

We used an AI assistant (Claude, by Anthropic) as a pair-programming and review partner. It never replaced understanding: we ran, tested and reviewed everything before keeping it.
- **Design discussions:** the sessions system (a weekly plan plus real sessions per date), the join request flow, the match flow with a referee, and how to compute the leaderboard. We compared options, then decided.
- **Tests:** drafts of the REST Client `.http` files for each group of endpoints. We ran them and fixed what failed.
- **Debugging:** explaining error logs (NestJS dependency injection, Prisma, RxJS, Docker builds).
- **Documentation:** drafts of `.env.example`, the API contract and this README.


## Team Information

| Member | Role(s) | Responsibilities |
|---|---|---|
| **hwahmane** | Product Owner, Developer (frontend) | Owns the product vision and the priorities, and validates finished work. Builds the frontend: pages, components, forms and state. Shares the UI design work with ablabib. |
| **znajdaou** | Project Manager, Developer | Plans the stages, tracks progress and deadlines, and removes blockers (with ablabib). Builds the club backend, the sessions system, the admin system (frontend and backend) and the infrastructure. |
| **ablabib** | Project Manager, Developer | Coordinates the team with znajdaou. Builds the real-time system (Socket.IO) and the notifications (frontend and backend). Made the first Figma designs with hwahmane. |
| **abnsila** | Tech Lead, Developer | Defines the architecture and the technology choices, and keeps the code quality. Builds authentication, the profile page and the leaderboard. Builds the infrastructure and the database schema with znajdaou. |

## Project Management

- **Stages.** We work in stages. Each stage has a goal and a deadline, the whole team works on it together, and we check that the goal is met before the next stage starts.

  | Stage | Goal |
  |---|---|
  | 1 | Design: the frontend in Figma and the database schema in drawSQL (the team split in two pairs, one for each) |
  | 2 | Infrastructure and project setup |
  | 3 | A basic "hello world" working end to end |
  | 4 | Authentication |
  | 5 | Clubs |
  | 6 and after | sessions, matches, leaderboard, notifications, admin, polish |

- **Contract first.** Each endpoint is written in an API contract before it is built, so the frontend and the backend work from the same document. A change to a shared contract is reviewed by the people on both sides.
- **Task distribution.** The work is split by area (authentication, clubs, sessions, notifications, frontend, devops), and each area has an owner (see Features List).
- **Tools.** Notion manages everything (tasks, planning, API contracts), Figma for the UI design, drawSQL for the database schema, and Git (one repository, commits from all members).
- **Communication.** Discord for daily talk, and weekly meetings to review the stage.

## Features List

| Feature | What it does | Built by |
|---|---|---|
| Sign up and login | Email and password, argon2 hashing, JWT in `httpOnly` cookies, refresh tokens that rotate and detect reuse | abnsila |
| Google sign-in | OAuth 2.0 with PKCE | abnsila |
| Password reset | A reset link sent by email | abnsila |
| Profile and settings | Profile page with stats, joined clubs, achievements and match history. Edit the profile and the avatar | abnsila |
| Clubs and roles | Club pages, members, roles (member, leader, coach), the coach edits the club | znajdaou (backend), hwahmane (frontend) |
| Join requests | A user asks to join, a leader accepts or rejects, the user can cancel | znajdaou (backend), hwahmane (frontend) |
| Sessions | Weekly training sessions, booking with limited spots, week navigation, leaders create, edit and cancel | znajdaou, hwahmane |
| Matches | A member asks for a match, a leader accepts and becomes the referee, the referee enters the result, cancel rules | znajdaou (backend), hwahmane (frontend) |
| Leaderboard | Ranking per club with points, wins and losses | abnsila |
| Gamification | Achievements, leaderboard, XP and level, rank badges | the whole team |
| Announcements | Leaders post news, members read it | znajdaou, hwahmane |
| Documents | Leaders share links to documents, members read them | znajdaou, hwahmane |
| Search and filters | Filter and paginate members, matches and the other lists | znajdaou (API), hwahmane (UI) |
| Notifications | Live push and a notification inbox | ablabib |
| Admin area | Manage users, admins, clubs and members, and see the usage statistics | znajdaou |
| Infrastructure | Docker, Compose, nginx, RabbitMQ, database setup, Makefile | znajdaou, abnsila |
| UI and design | Figma design, pages, reusable components, forms | hwahmane, ablabib |

## Modules

| # | Module | Type | Points | Built by |
|---|---|---|---|---|
| 1 | Framework for the frontend and the backend (Next.js, NestJS) | Major | 2 | the whole team |
| 2 | Backend as microservices | Major | 2 | znajdaou, abnsila |
| 3 | Real-time features with WebSockets | Major | 2 | ablabib |
| 4 | Advanced permissions system | Major | 2 | znajdaou |
| 5 | Organization system (the clubs) | Major | 2 | znajdaou, hwahmane |
| 6 | Custom module: club sessions and booking | Major | 2 | znajdaou |
| 7 | Use an ORM (Prisma) | Minor | 1 | the backend team |
| 8 | Remote authentication with OAuth 2.0 (Google) | Minor | 1 | abnsila |
| 9 | Notification system | Minor | 1 | ablabib |
| 10 | Server-side rendering (SSR) | Minor | 1 | hwahmane |
| 11 | Custom design system | Minor | 1 | hwahmane, ablabib |
| 12 | Advanced search (filters, sorting, pagination) | Minor | 1 | znajdaou, hwahmane |
| 13 | Support for additional browsers | Minor | 1 | the whole team |
| 14 | Gamification system | Minor | 1 | the whole team |
| 15 | User activity analytics dashboard | Minor | 1 | znajdaou |
| 16 | Game statistics and match history | Minor | 1 | abnsila, znajdaou |
| 17 | Custom module: announcements | Minor | 1 | znajdaou, hwahmane |
| 18 | Custom module: documents | Minor | 1 | znajdaou, hwahmane |

**Total: 24 points.** The subject requires 14. The extra modules are a safety margin, and only the modules that work in the demo count.

### Justification and implementation

1. **Frameworks (Major).** Next.js (React) for the frontend and NestJS for the backend. Both give a clear structure and a full ecosystem, and the two sides share TypeScript types through `libs/contracts`.
2. **Microservices (Major).** An API gateway and three services (auth, club, notification), each with one job and its own database schema. They talk through RabbitMQ (request/reply and events). The gateway is the only public app.
3. **WebSockets (Major).** A Socket.IO server in the gateway. A socket is authenticated with the user's token, and each user receives only their own events.
4. **Advanced permissions (Major).** Roles: admin, coach, leader, member. An admin can add and delete admins, create and delete clubs, view, edit and delete users, update and remove members, and see the statistics. A coach or leader manages a club: members, join requests, sessions, matches, announcements and documents. Each role sees different screens, and the backend checks the role on every request, not only the interface.
5. **Organization system (Major).** A club is an organization. It can be created and deleted (admin) and edited (coach). Users are added by a leader or by accepting a join request, and removed by a leader. Inside a club, members book sessions and request matches, and leaders create, read, update and delete sessions, announcements, documents and achievements.
6. **Custom module: sessions (Major).** The full description will be in [docs/SESSIONS.md](docs/SESSIONS.md).
   - *Why:* clubs train every week with a limited number of spots, so members need to see a week and book a spot, and leaders need to manage the schedule.
   - *Technical challenges:*
     - A weekly plan (template) is separate from the real sessions per date, so changing the plan never rewrites history.
     - Week navigation: past weeks are read-only, and the next week is created from the plan on demand, safely even when two users open it at the same time.
     - Booking under concurrency: the last spot is taken in a transaction with a row lock, so two users cannot both get it.
     - Time: one time zone for all day and week math, sessions that cross midnight, and cancelled sessions that are kept and never recreated.
     - Edit scope: change one session, or also the future ones, with the booked members notified.
   - *Value:* it is the main weekly use of the platform.
   - *Why Major:* scheduling logic, concurrency control and a week-based interface, far beyond a simple CRUD.
7. **ORM (Minor).** Prisma in every service, with typed queries, committed migrations and seeds.
8. **OAuth (Minor).** Google sign-in with the authorization code flow, PKCE, `state` and `nonce`. It creates a new account or links an existing one.
9. **Notifications (Minor).** The notification service stores a notification inbox and pushes live messages over WebSocket. Examples: a user sends a request to join a club (the leaders are notified), a leader accepts it (the user is notified), a leader rejects it (the user is notified).
10. **SSR (Minor).** Next.js renders pages on the server, for faster first loads and better SEO.
11. **Design system (Minor).** Tailwind CSS, the Poppins font, the colors of the [UM6P brand guidelines](https://um6pbrandgo.studio/), Lucide icons, and global CSS variables (the shadcn/ui theme settings) with a light and dark theme toggle. The components are shadcn/ui primitives (button, dialog, table, tabs, select, and more) plus our own components built on them, for example the club card, session card, leaderboard row, rank and streak badges, achievement badge, match player card, pagination and the notification panel.
12. **Advanced search (Minor).** The members list is filtered by role and login, and the matches list is filtered by status and "my matches" and sorted by date. All lists are paginated on the server. sessions, announcements and documents are also paginated. The backend validates the filters and sorting, and the frontend keeps the state in the URL.
13. **Additional browsers (Minor).** Tested and working in firefox, in addition to Google Chrome.
14. **Gamification (Minor).** Achievements (14 codes, such as first win, ten wins and season champion, given by leaders or earned), a leaderboard per club, and an XP and level system. Everything is stored in the database. Users get visual feedback through rank badges (first, second, third place), hot streak and undefeated badges, and rank cards.
15. **Analytics dashboard (Minor).** An admin dashboard with charts that show the usage of the platform: signups, matches, sessions attendance, members per club.
16. **Game statistics and match history (Minor).** Each user has stats (wins, losses, win rate, ladder points, current streak), a match history (opponents, date, result), achievements, and a leaderboard rank per club. The matches are played in real life (singles or doubles) and recorded in the app by the referee.
17. **Custom module: announcements (Minor).** The full description will be in [docs/ANNOUNCEMENTS.md](docs/ANNOUNCEMENTS.md).
   - *Why:* leaders need one place to give news to all the members of a club.
   - *Technical challenges:* only leaders and coaches can publish or delete, only members can read, the list is paginated with the newest first, and the author data comes from another service (auth) and is merged into the response.
   - *Value:* members stay informed without leaving the platform.
   - *Why Minor:* a small feature with a limited scope.
18. **Custom module: documents (Minor).** The full description will be in [docs/DOCUMENTS.md](docs/DOCUMENTS.md).
   - *Why:* clubs share rules, schedules and forms.
   - *Technical challenges:* links are validated on the backend (protocol and length), titles are trimmed, only leaders and coaches can add or delete, a club can never delete another club's document, and the list is paginated.
   - *Value:* one place for all the club documents.
   - *Why Minor:* a small feature with a limited scope.

## Individual Contributions

**hwahmane**
- Built the frontend: pages and components, forms (Zod and React Hook Form), state (Zustand) and data fetching (TanStack Query).
- UI design with ablabib.
- Challenge: making the interface responsive on every screen, and learning new technologies.

**znajdaou**
- Devops: the infrastructure with abnsila (Docker, Compose, nginx, RabbitMQ, database).
- Club backend: clubs, members and roles, join requests, announcements, documents, achievements and matches.
- The sessions system, with the week and booking logic.
- The admin system, frontend and backend.
- The database schema, with abnsila.
- Challenges: the sessions system was far more complex than expected and took a lot of time. Setting up the project structure and keeping a long-term vision was also hard. On the technical side: designing sessions so that history never changes when a plan changes, keeping booking safe when two users take the last spot, handling the time-zone change in Morocco (UTC+0 since 20 September 2026), and mapping errors between microservices to HTTP codes.

**ablabib**
- The real-time system: Socket.IO server and authenticated sockets.
- The notification system, frontend and backend, with TanStack Query hooks.
- The first Figma designs, with hwahmane.
- Challenge: working as a team on a complex project with a short deadline, and having many things to learn.

**abnsila**
- Authentication, frontend and backend: email and password, JWT cookies, refresh token rotation, Google sign-in and password reset.
- The profile page, and the leaderboard (UI and API).
- The infrastructure with znajdaou, and the database schema.
- Challenge: building the whole authentication system from scratch.
