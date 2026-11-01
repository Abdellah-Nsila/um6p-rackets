# Modules

This document explains, for each chosen module, what it does, how it is built and where to see it in the running app. The short table is also in the [README](../README.md). The endpoints are in [API.md](API.md), the tables in [DATABASE.md](DATABASE.md), and the architecture in [ARCHITECTURE.md](ARCHITECTURE.md).

## Summary

| # | Module | Type | Points |
|---|---|---|---|
| 1 | Framework for the frontend and the backend (Next.js, NestJS) | Major | 2 |
| 2 | Backend as microservices | Major | 2 |
| 3 | Real-time features with WebSockets | Major | 2 |
| 4 | Advanced permissions system | Major | 2 |
| 5 | Organization system (the clubs) | Major | 2 |
| 6 | Custom module: club sessions and booking | Major | 2 |
| 7 | Use an ORM (Prisma) | Minor | 1 |
| 8 | Remote authentication with OAuth 2.0 (Google) | Minor | 1 |
| 9 | Notification system | Minor | 1 |
| 10 | Server-side rendering (SSR) | Minor | 1 |
| 11 | Custom design system | Minor | 1 |
| 12 | Advanced search (filters, sorting, pagination) | Minor | 1 |
| 13 | Support for additional browsers | Minor | 1 |
| 14 | Gamification system | Minor | 1 |
| 15 | User activity analytics dashboard | Minor | 1 |
| 16 | Game statistics and match history | Minor | 1 |
| 17 | Custom module: announcements | Minor | 1 |
| 18 | Custom module: documents | Minor | 1 |

**Total: 24 points** (6 Major × 2 + 12 Minor × 1). The subject requires 14. The extra modules are a safety margin, and only the modules that work in the demo count.

---

## Major modules

### 1. Frameworks for the frontend and the backend (Major, 2 points)

**What it does.** The whole application is built on two frameworks: Next.js (React) for the interface and NestJS (TypeScript) for the backend.

**How it is built.** NestJS is used as a monorepo of four apps (`api-gateway`, `auth-service`, `club-service`, `notification-service`). Its modules and dependency injection keep the four apps consistent, and it has built-in support for microservices. The frontend uses Next.js with Tailwind CSS. Both sides are written in TypeScript and share their types through `libs/contracts`.

**Where to see it.** Any page of the app, and the `backend/` and `frontend/` folders.

### 2. Backend as microservices (Major, 2 points)

**What it does.** The backend is split into services that each do one job and can change independently.

**How it is built.**
- `api-gateway`: the only public backend app (REST, authentication check, Socket.IO).
- `auth-service`: users, login, tokens, Google OAuth, password reset.
- `club-service`: clubs, members, join requests, sessions, matches, leaderboard, announcements, documents, achievements.
- `notification-service`: the inbox and the live events.
- The services talk through RabbitMQ (request/reply and events), with typed messages in `libs/contracts`.
- Each service has its own PostgreSQL schema and database role, and never reads another service's tables. A user id from another service is a plain id, not a foreign key.

**Where to see it.** `make status` lists one container per service, and the README and [ARCHITECTURE.md](ARCHITECTURE.md) show the flows.

### 3. Real-time features with WebSockets (Major, 2 points)

**What it does.** Users receive their notifications immediately, without reloading the page.

**How it is built.** A Socket.IO server runs inside the gateway. A socket is authenticated with the user's token when it connects, and each user receives only their own events. When the notification service saves a new notification, the gateway pushes it to the sockets of the receivers.

**Where to see it.** Open the app with two users. Send a join request with the first user, and watch the notification of a leader arrive without a refresh.

### 4. Advanced permissions system (Major, 2 points)

**What it does.** Each role sees different screens and can do different actions.

**How it is built.**

| Role | Level | What it can do |
|---|---|---|
| Admin | platform (`users.role = ADMIN`) | manage users (view, edit, role, delete), create and delete clubs, see the usage statistics |
| Coach | club (`members.role = 2`) | everything a leader can do, edit the club, promote and demote leaders, remove any member, add leaders |
| Leader | club (`members.role = 1`) | members (role 0), join requests, sessions, matches (accept as referee), announcements, documents, achievements |
| Member | club (`members.role = 0`) | read the club, book sessions, request matches, enter results of the matches they refereed |

The backend checks the role on every request, not only in the interface. A user is a member of a club only while `left_at` is null, and the match result can only be entered by the referee of that match.

**Where to see it.** Log in as a member, a leader, a coach and an admin, and compare the menus and the actions. Call a leader route with a member token and you get 403.

### 5. Organization system (Major, 2 points)

**What it does.** A club is an organization that has its own members, content and rules.

**How it is built.**
- An admin creates a club (with its first coach, in one transaction) and can delete it (soft delete).
- A coach edits the club (name and description). The slug is rebuilt when the name changes.
- Users join through a request that a leader accepts or rejects, or a leader adds them directly. A leader or coach removes members, and a member can leave (the last coach cannot).
- Everything inside a club belongs to that club: sessions, matches, announcements, documents, achievements and the leaderboard.

**Where to see it.** The clubs list, a club page, the join request badge of a leader, and the admin area.

### 6. Custom module: club sessions and booking (Major, 2 points)

**What it does.** Clubs publish a weekly training schedule, members book a limited number of spots, and leaders manage the schedule.

**How it is built.** A weekly plan is separate from the real sessions, so a change in the plan never rewrites history. The next week is created from the plan on demand. Booking runs in a transaction with a row lock, so the last spot cannot be taken twice. One time zone is used for all the day and week calculations. An edit or a cancellation can apply to one session or to all the future ones, and the booked members are notified.

**Why Major.** Scheduling logic, concurrency control and a week-based interface, far beyond a simple CRUD. The full description is in [SESSIONS.md](SESSIONS.md).

**Where to see it.** The sessions tab of a club: change the week, book a spot, and (as a leader) create, edit and cancel a session.

---

## Minor modules

### 7. Use an ORM (Minor, 1 point)

Prisma is used in every service, with typed queries, committed migrations and a seed. Each service has its own `schema.prisma`. The `*-migrate` and `*-seed` containers run them at startup (`make`).

### 8. Remote authentication with OAuth 2.0 (Minor, 1 point)

**What it does.** A user can sign in with a Google account. It creates a new account, or links the Google identity to an existing account.

**How it is built.** Authorization code flow with PKCE, `state` and `nonce`. The flow starts at `GET /auth/google/login`, and Google calls `GET /auth/google/callback`. The link between a user and Google is stored in the `identities` table (`provider`, `subject`). The `returnTo` address is checked, so the user can only be sent back to a page of our own site.

**Where to see it.** The "Continue with Google" button of the login page. It needs the Google keys described in the README.

### 9. Notification system (Minor, 1 point)

**What it does.** Users have a notification inbox, with a read state, and receive new notifications live.

**How it is built.** The notification service stores each notification once and one row per receiver (`notification_receivers`), with `is_read`. The inbox is paginated, and a user can mark one notification or all of them as read. Examples: a user asks to join a club (the leaders are notified), a leader accepts the request (the user is notified), a leader posts an announcement.

**Where to see it.** The notification panel of the header.

### 10. Server-side rendering (Minor, 1 point)

Next.js renders the pages on the server, for a faster first load and better SEO.

### 11. Custom design system (Minor, 1 point)

**What it does.** The whole interface uses the same colors, fonts, icons and components.

**How it is built.**
- Tailwind CSS, the Poppins font, the colors of the UM6P brand guidelines, Lucide icons, and global CSS variables (the shadcn/ui theme settings).
- A light and a dark theme, with a toggle.
- Components: shadcn/ui primitives (button, dialog, table, tabs, select, and more) and our own components built on them: club card, session card, leaderboard row, rank and streak badges, achievement badge, match player card, pagination, notification panel.

**Where to see it.** Any page, in the light and the dark theme.

### 12. Advanced search (Minor, 1 point)

**What it does.** Lists can be filtered, sorted and paginated.

**How it is built.**
- Members: filter by role and by login (exact match).
- Matches: filter by status and "my matches", sorted by date.
- Sessions, announcements, documents, achievements, leaderboard and join requests are paginated.
- The pagination, filters and sorting are done on the server, and the backend validates them. The frontend keeps the state in the URL, so a page can be shared or reloaded.

**Where to see it.** The members tab and the matches tab of a club.

### 13. Support for additional browsers (Minor, 1 point)

**What it does.** The app works the same in more than one browser.

**How it is built.** Tested in Firefox and Google Chrome.

### 14. Gamification system (Minor, 1 point)

**What it does.** Members get rewards for what they do in their club.

**How it is built.**
- Achievements: 14 codes (for example first win, ten wins, season champion). Leaders give them by hand, and some can be earned automatically.
- A leaderboard per club, with points, wins, losses and streaks.
- XP and level or points level up.
- Visual feedback: rank badges (first, second, third place), hot streak and undefeated badges, and rank cards.

**Where to see it.** The leaderboard tab of a club and the profile page.

### 15. User activity analytics dashboard (Minor, 1 point)

**What it does.** An admin sees how the platform is used.

**How it is built.** `GET /admin/stats?weeks=8` (1 to 26 weeks). The gateway merges the counts of the auth service (signups) and of the club service (matches, session attendance, members per club) by week, and the admin dashboard shows them in charts.

**Where to see it.** The admin area, with an admin account.

### 16. Game statistics and match history (Minor, 1 point)

**What it does.** Every user has statistics and a history of their matches.

**How it is built.** The matches are played in real life (singles or doubles) and recorded in the app: a member requests a match, a leader accepts it and becomes the referee, and the referee enters the result. The profile page shows wins, losses, win rate, ladder points, current streak, the achievements, the rank in each club, and a paginated history of the finished matches (opponents, date, result). The points are stored on each match, so the history never changes if the formula changes later.

**Where to see it.** The profile page, and the matches tab of a club.

### 17. Custom module: announcements (Minor, 1 point)

**What it does.** Leaders and coaches publish news for all the members of a club.

**Why.** A club needs one place to inform its members, without leaving the platform.

**How it is built.**
- Only a leader or a coach can publish or delete an announcement. Only the members of the club can read them.
- The list is paginated, newest first.
- The author is a member of the club, and the author's name and avatar come from the auth service and are merged into the response.
- The text is validated on the backend (and in the form).
- A new announcement can notify the members (notification type `CLUB_ANNOUNCEMENT`).

**Why Minor.** A small feature with a limited scope.

### 18. Custom module: documents (Minor, 1 point)

**What it does.** Leaders and coaches share links to documents (rules, schedules, forms), and members read them.

**Why.** Clubs share the same few documents, and they need one place for them.

**How it is built.**
- Only a leader or a coach can add or delete a document. Only the members of the club can read them.
- A document has a title (trimmed, not blank, up to 255 characters), an optional description and a link (`path`).
- The link is validated on the backend: it must be a full address with a protocol, so a broken link cannot be saved. The form validates it too.
- A club can never delete the document of another club.
- The list is paginated.

**Why Minor.** A small feature with a limited scope.