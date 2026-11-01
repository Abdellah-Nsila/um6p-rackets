# API

REST API of UM6P Rackets. Every request goes through the **api-gateway**, which checks the user and forwards the call to the right service (see [ARCHITECTURE.md](ARCHITECTURE.md)). The request and response types are defined in `libs/contracts` (backend) and in the types file of the frontend.

## 1. Conventions

- **Base URL:** `https://localhost/api/v1`. Resources: `/auth`, `/users`, `/clubs`, `/notifications`, `/admin`.
- **Authentication:** the user logs in with `POST /auth/login`. The server sets two `HttpOnly` cookies (`SameSite=lax`): `access_token` (JWT, 15 minutes) and `refresh_token` (opaque, 7 days, replaced on every refresh). The browser sends them automatically: there is no `Authorization` header and nothing in `localStorage`. The current user id always comes from the token, never from the body. Every route needs a valid token unless it is marked **Public**.
- **Access levels.** A user's level inside one club:

| Level | Meaning |
|---|---|
| Public | No token needed (visitor) |
| User | Logged in, any account |
| Member | Active member of that club (role 0, 1 or 2) |
| Leader | Role 1 or 2 |
| Coach | Role 2 |
| Referee | The member who accepted that match (`ref_id`), a leader or coach at that moment |
| Admin | Platform role `ADMIN` (not tied to a club) |

- **Errors:** `{ "statusCode", "error", "message" }`.

| Code | Meaning |
|---|---|
| 400 | bad input |
| 401 | no token or invalid token |
| 403 | wrong role |
| 404 | not found |
| 409 | conflict (already member, session full, last coach, join request already handled) |
| 422 | validation error (for example invalid match players) |
| 429 | too many requests (rate limit, see below) |
| 503 | the notification service did not answer in 5 seconds |

- **Rate limit:** the auth routes, `/users/me/profile`, `/users/me` (PATCH), `/users/:user_id/profile` and `/auth/me` are limited to `REQUEST_LIMIT` requests per `REQUEST_TTL` seconds.
- **Pagination:** `?page=1&limit=20` returns `Paginated<T>`: `{ data, page, limit, total }`.
- **Ids and slugs:** `:slug` is the club slug (for example `table-tennis`). `:matchId`, `:sessionId`, `:memberId` are club-service ids. The body fields `partner_id` and `opponent_ids` are **member ids**. `user_id` is an auth-service user id.
- **Dates:** ISO strings. Weeks, "today" and session times use the app time zone, `Africa/Casablanca` (UTC+0 since 20 September 2026), never the server time.
- **Week:** weeks run Monday to Sunday. `?week=YYYY-MM-DD` accepts any date of the week and the server uses its Monday. The default is the current week. Past weeks are read-only and can be opened up to one year back. Only one week ahead can be opened. A week outside that range returns 400. A session belongs to the week it starts in. `weekday` is 0 (Monday) to 6 (Sunday).
- **Slugs:** the slug is built from the club name: lowercase, trimmed, spaces replaced by single dashes (`Tennis Club Pro` becomes `tennis-club-pro`), and unique. It changes only when the club is renamed with `PATCH /clubs/:slug`, and it can never be sent in a body. After a rename the old slug returns 404, so the client must use the slug returned by the update. `users` is a reserved slug. URLs use the slug, and everything inside the system (foreign keys, messages between services, `member_id`) uses the numeric club id.
- **Nothing played or booked is deleted.** Cancelling a session sets `cancelled_at`, cancelling a match sets status 3, and the rows stay for the history.

## 2. Auth (`/auth`)

All routes have a rate limit.

| Method | Path | Access | Body / query | Response | Notes |
|---|---|---|---|---|---|
| GET | `/auth/health` | Public | | `HealthResult` | |
| POST | `/auth/register` | Public | `RegisterDto` | 201 `{ user }` | Creates the account and logs in (sets both cookies). |
| POST | `/auth/login` | Public | `{ email, password }` | 200 `{ user }` | Sets both cookies. |
| POST | `/auth/refresh` | Public | none (reads the `refresh_token` cookie) | 200, empty | Sets a new pair of cookies. If the cookie is missing: 401. If the token is expired or was already used, the server deletes both cookies and returns 401. |
| GET | `/auth/google/login` | Public | `?returnTo=` | 302 redirect to Google | Starts the OAuth flow (PKCE, `state`, `nonce`). `returnTo` is checked and must be a safe path of our own site. A short-lived OAuth cookie is set. |
| GET | `/auth/google/callback` | Public | `?code&state&error` | 302 redirect to the frontend | On success: sets both cookies and redirects to `returnTo` with `?oauth=success`. If the user refuses: `?error=oauth_cancelled`. On any other failure: `?error=oauth_failed`. |
| POST | `/auth/logout` | User | none | 200 `SuccessResult` | Revokes the refresh token and deletes both cookies. |
| POST | `/auth/forget-password` | Public | `{ email }` | 202 `SuccessResult` | Sends a reset link by email. |
| POST | `/auth/reset-password` | Public | `{ token, password }` | 200 `SuccessResult` | |
| GET | `/auth/me` | User | | `{ user }` | The logged-in user. |
| GET | `/auth/login-available` | Public | `?login=` | `{ available: boolean }` | Used by the sign-up form. |

`RegisterDto` fields: `login, first_name, last_name, email, password...`.

## 3. Users (`/users`)

All routes need a token. `me` is the logged-in user.

| Method | Path | Body / query | Response | Notes |
|---|---|---|---|---|
| GET | `/users/me/profile` | | `UserProfile` | `{ user, memberProfile }`. The `user` comes from the auth service, the `memberProfile` (stats, ranks) from the club service. |
| GET | `/users/:user_id/profile` | | `UserProfile` | 404 if the user does not exist. |
| PATCH | `/users/me` | `UpdateUserDto` | `{ user }` | A user can only update their own profile. |
| GET | `/users/:user_id/memberships` | | `JoinedClub[]` | The clubs the user belongs to. |
| GET | `/users/:user_id/achievements` | | `Achievement[]` | |
| GET | `/users/:user_id/matches` | `?page&limit` (default 1 and 10) | `Paginated<UserHistoryMatch>` | Finished matches only. |

## 4. Notifications (`/notifications`)

The inbox of the logged-in user. The gateway waits at most 5 seconds for the service and returns 503 if it does not answer.

| Method | Path | Body / query | Response | Notes |
|---|---|---|---|---|
| GET | `/notifications/inbox` | `?page&limit` | `Paginated<...>`Notifications` | Newest first. |
| POST | `/notifications/:notification_id/read` | | `{}` | Marks one notification as read. 400 if the id is not a number. |
| POST | `/notifications/read-all` | | `{}` | Marks all as read. |

**Types in the database:** `JOIN_REQUESTED`, `JOIN_ACCEPTED`, `JOIN_REJECTED`, `CLUB_ANNOUNCEMENT`.

**When notifications are sent.** The club service calls the notification service after the database save. It never sends one for a repeated click. Events in the contract: a new or reopened join request (to the leaders and coaches), an accepted join request (to the user), a new match request (to the leaders and coaches), a match accept or cancel (to the players and the referee), and a session cancelled or changed in time or location (to the booked members).

**Live push.** New notifications are also pushed over Socket.IO.

## 5. Clubs (`/clubs`)

### 5.1 Public

| Method | Path | Query | Response |
|---|---|---|---|
| GET | `/clubs` | none (all clubs, no pagination) | `Club[]` |
| GET | `/clubs/:slug` | | `ClubWithMembersCount` |

### 5.2 User (logged in)

| Method | Path | Body | Response | Notes |
|---|---|---|---|---|
| GET | `/clubs/:slug/status` | | `ClubMemberStatus` | Not a member returns `is_member: false` and nulls. `has_pending_request` is true while my join request waits for a leader. |
| POST | `/clubs/:slug/join` | | `{ status: 'pending' }` | Creates my join request, or reopens a rejected or cancelled one (same row, back of the queue). Asking again while pending returns the same answer and sends no second notification. 409 if already a member. |
| DELETE | `/clubs/:slug/join` | | `{ success: true }` | Cancels my pending request. 404 if I have none. |

### 5.3 Member (role 0, 1, 2)

| Method | Path | Query / body | Response | Notes |
|---|---|---|---|---|
| GET | `/clubs/:slug/members` | `?role&login&page&limit` | `Paginated<MemberWithUser>` | Active members only, sorted by `id`. `login` is an exact match, and an unknown login returns an empty page. |
| GET | `/clubs/:slug/announcements` | `?page&limit` | `Paginated<AnnouncementWithAuthor>` | Newest first. |
| GET | `/clubs/:slug/sessions` | `?week=YYYY-MM-DD` | `WeekView` | Sessions that start in that week, sorted by `start_at`, cancelled ones included (`state: cancelled`). Creates the missing sessions of **next week** from the weekly plans (never the current week). 400 if `week` is not a real date, is more than one week ahead, or is more than one year back. |
| GET | `/clubs/:slug/matches` | `?status=all\|pending\|upcoming\|completed\|cancelled&mine=true\|false&page&limit` | `Paginated<MatchDetail>` | `pending` = status 0, `upcoming` = 1, `completed` = 2, `cancelled` = 3. `mine=true` keeps only the matches where I play or referee (default false). Pending and upcoming are sorted by `scheduled_at` ascending, the others descending. In the pending list a plain member sees only their own matches, leaders see all. |
| GET | `/clubs/:slug/matches/:matchId` | | `MatchDetail` | 403 if a plain member opens a pending match they are not part of. A match of another club returns 404. |
| GET | `/clubs/:slug/leaderboard` | `?page&limit=10` | `Paginated<LeaderboardEntry>` | Ordered by points. |
| GET | `/clubs/:slug/achievements` | `?page&limit` | `Paginated<Achievement & { user: UserSummary }>` | Newest first. |
| GET | `/clubs/:slug/documents` | `?page&limit` | `Paginated<ClubDocument>` | Newest first. |
| GET | `/clubs/:slug/members/me/attendance` | `?page&limit` | `Paginated<SessionView>` | My booked sessions, newest first. |
| POST | `/clubs/:slug/sessions/:sessionId/attend` | | `{ success: true }` | Books a spot. 404 not in this club, 422 cancelled or ended, 409 full or already booked. |
| DELETE | `/clubs/:slug/sessions/:sessionId/attend` | | `{ success: true }` | Cancels my booking, only before the session starts. |
| POST | `/clubs/:slug/matches/request` | `MatchRequestBody` | `{ message, pending_match_id }` | The requester is player 1 of team 1. Creates the teams if needed and a match with status 0 and no referee. See the match rules below. |
| POST | `/clubs/:slug/matches/:matchId/cancel` | | `Match` | Status 3, `cancelled_at`, `cancelled_by`. 409 on a finished or already cancelled match. |
| POST | `/clubs/:slug/matches/:matchId/result` | `{ team1_score, team2_score }` | `MatchDetail` | **Referee only.** Only on status 1 and only after `scheduled_at`. Scores are whole numbers from 0, 422 on a draw. The server sets `winner_id`, the points (winner +10, loser −5 for now) and status 2. 409 if a result was already entered. |
| DELETE | `/clubs/:slug/leave` | | 204 | Sets `left_at`. 409 if I am the only coach. |

### 5.4 Leader (role 1, 2)

| Method | Path | Body | Response | Notes |
|---|---|---|---|---|
| POST | `/clubs/:slug/members` | `{ user_id, role? }` | `Member` | Adds a user or re-activates a former member. A leader can only add role 0, a coach can add 0 or 1. 409 if already active. **This is how a join request is accepted:** in the same transaction the pending request is marked accepted. A user with no request can be added directly. |
| DELETE | `/clubs/:slug/members/:memberId` | | 204 | Sets `left_at`. A leader can only remove role 0. A coach can remove anyone except themselves (they use `/leave`). |
| GET | `/clubs/:slug/join-requests` | `?page&limit` | `Paginated<JoinRequestWithUser>` | Pending only, oldest first. `total` is the number for the badge. The `user` is a summary: email and phone are never sent. |
| POST | `/clubs/:slug/join-requests/:requestId/reject` | | `{ success: true }` | Status 2. 409 if already handled, 404 if it is not in this club. The user can ask again. |
| POST | `/clubs/:slug/announcements` | `{ description }` | `Announcement` | |
| DELETE | `/clubs/:slug/announcements/:announcementId` | | 204 | |
| POST | `/clubs/:slug/sessions` | `CreateSessionBody` | `SessionView[]` | Adds a session in a week (default the current week). Sessions that have already ended are not created. With `repeat_weekly: true` it also saves the weekly plan. A cancelled session at the same start is reused. 409 if the exact same slot already exists. |
| PATCH | `/clubs/:slug/sessions/:sessionId` | `UpdateSessionBody` | `SessionView` | `apply_to_future` false = this session only, true = also all later sessions and the weekly slot. Send `start_time` and `end_time` together. 422 if the session is ended or cancelled, or if `capacity` is below the bookings of an affected session. The weekday cannot change. |
| DELETE | `/clubs/:slug/sessions/:sessionId` | `?apply_to_future=true\|false&template_id=3` | 204 | False (default) = cancel this session only. True = also delete the weekly plan and cancel the later sessions that have not ended. No session row is ever deleted. Booked members are notified. Ended sessions cannot be cancelled. |
| POST | `/clubs/:slug/matches/:matchId/accept` | | `Match` | The leader or coach who accepts becomes the referee (`ref_id`), and the status becomes 1. The first accept wins, the others get 409. 422 if the leader is one of the players or `scheduled_at` has passed. To refuse a request, use cancel. |
| POST | `/clubs/:slug/documents` | `{ title, description?, path }` | `ClubDocument` | `path` is a full link with a protocol. `title` is trimmed and cannot be blank. |
| DELETE | `/clubs/:slug/documents/:documentId` | | 204 | |
| POST | `/clubs/:slug/achievements` | `{ user_id, code }` | `Achievement` | `user_id` must be an active member. `awarded_by` is set by the server, never from the body. 409 if the user already has that `code`. 400 on an unknown `code`. |
| DELETE | `/clubs/:slug/achievements/:achievementId` | | 204 | 404 if the achievement belongs to another club. |

### 5.5 Coach (role 2)

| Method | Path | Body | Response | Notes |
|---|---|---|---|---|
| PATCH | `/clubs/:slug` | `{ name?, description? }` | `Club` | A leader gets 403. At least one field is needed. The name is trimmed and cannot be blank. When the name changes, the slug is rebuilt, and 409 is returned if the name or the new slug belongs to another club. `slug` and `avatar` are not accepted (400). |
| PATCH | `/clubs/:slug/members/:memberId/role` | `{ role: 0 \| 1 }` | `Member` | Promotes to leader or demotes to member. Cannot change my own role or set role 2. |

## 6. Admin (`/admin`)

Every route under `/admin` needs the platform role `ADMIN` (the role is in the JWT). Any other user gets 403.

| Method | Path | Body / query | Response | Notes |
|---|---|---|---|---|
| GET | `/admin/users` | `AdminUserListQuery` | `Paginated<AdminUser>` | Deleted users are excluded. Partial, case-insensitive search on first name, last name and login. |
| PATCH | `/admin/users/:id` | `UpdateAdminUserBody` | `AdminUser` | At least one field. 403 if you change your own role. 404 if the user does not exist. |
| DELETE | `/admin/users/:id` | | 204 | Soft delete plus anonymization. 403 if it is yourself. |
| POST | `/admin/clubs` | `CreateClubBody` | 201 `Club` | Creates the club and its first coach (role 2) in one transaction. 409 if the name or slug exists. 404 if the coach user does not exist. 400 if the slug is `users`. |
| DELETE | `/admin/clubs/:slug` | | 204 | Soft delete. The club disappears from `GET /clubs` and every `/clubs/:slug/...` route returns 404. |
| GET | `/admin/stats` | `?weeks=8` (1 to 26) | `AdminStats` | The gateway merges the counts of the auth service and of the club service by `week_start`. |

## 7. Request types

```ts
export type MatchRequestBody = {
  mode: MatchMode;          // 1 = singles, 2 = doubles
  partner_id?: number;      // member id, required for doubles, forbidden for singles
  opponent_ids: number[];   // member ids, 1 for singles, 2 for doubles
  location?: string | null; // max 100 characters, trimmed
  scheduled_at: string;     // ISO, must be in the future
};

export type CreateSessionBody = {
  weekday: WeekDay;         // 0 = Monday ... 6 = Sunday
  start_time: string;       // "HH:mm"
  end_time: string;         // "HH:mm", earlier than start_time = ends the next day
  title?: string | null;    // up to 100 characters
  location?: string | null; // up to 100 characters
  capacity: number;         // 1..1000
  week_start?: string;      // "YYYY-MM-DD", the Monday of the week. Default: the current week
  repeat_weekly?: boolean;  // false (default) = that week only, true = also save the weekly plan
};

export type UpdateSessionBody = {
  start_time?: string;      // "HH:mm", send together with end_time
  end_time?: string;        // "HH:mm"
  title?: string | null;
  location?: string | null;
  capacity?: number;
  apply_to_future?: boolean; // false (default) = this session only
  template_id?: number;      // the weekly plan of the session, used with apply_to_future
};

export enum JoinRequestStatus { PENDING = 0, ACCEPTED = 1, REJECTED = 2, CANCELLED = 3 }

export type ClubMemberStatus = {
  is_member: boolean;
  member_id: number | null;
  role: MemberRole | null;
  has_pending_request: boolean; // true = the button shows "Requested" instead of "Join"
};
```

The achievement codes (`AchievementCode`) are: `FIRST_WIN`, `TEN_WINS`, `FIFTY_WINS`, `WIN_STREAK_5`, `SEASON_CHAMPION`, `RUNNER_UP`, `THIRD_PLACE`, `FIRST_SESSION`, `TEN_SESSIONS`, `PERFECT_ATTENDANCE`, `FOUNDING_MEMBER`, `MOST_IMPROVED`, `MVP`, `BEST_TEAMMATE`. A code is never renamed or deleted, because old rows use it.

## 8. Rules behind the endpoints

### Join requests
```
POST   /join                       -> status 0 (pending), the leaders are notified
POST   /members (a leader)         -> status 1 (accepted), the user becomes a member (or is re-activated)
POST   /join-requests/:id/reject   -> status 2 (rejected)
DELETE /join                       -> status 3 (cancelled), by the user
POST   /join again                 -> status 0 again, from rejected, cancelled or accepted (the user left since)
```
- One row per user and club. When the user asks again, the same row is reused and goes to the end of the queue.
- Rejecting and cancelling never delete the row. Reject is one atomic update on a pending request, so a request that was already handled returns 409.
- Leaving the club does not touch the request row.
- Not in this version: a message with the request, and a waiting time after a rejection.

### Matches
```
POST /matches/request     -> status 0 (pending), no referee yet
POST /matches/:id/accept  -> status 1 (upcoming), the leader who accepts becomes the referee
POST /matches/:id/result  -> status 2 (completed), winner and points set
POST /matches/:id/cancel  -> status 3 (cancelled), from status 0 or 1, the row is kept
```
- **Request validation (422 otherwise):** the requester and all players are active members of the club and all different. Singles: no `partner_id` and exactly 1 opponent. Doubles: a `partner_id` and exactly 2 opponents. `scheduled_at` must be in the future.
- **Accept** is one atomic update (set `ref_id` and status 1 where the status is still 0). Two leaders clicking at the same time cannot both win: the second gets 409. The referee cannot be a player, and a match cannot be accepted after `scheduled_at`.
- **Result:** only the referee, only after `scheduled_at`. The higher score wins and a draw is rejected. Points are stored on the match (`team1_points`, `team2_points`), so the history never changes if the formula changes later. A finished match never changes.
- **Cancel:** status 0 = the requester or a leader. Status 1 before `scheduled_at` = any player, the referee or a leader. Status 1 after `scheduled_at` = the referee or a leader. Status 2 or 3 = 409.
- History and the leaderboard use finished matches only.

### Sessions
The full design is in [SESSIONS.md](SESSIONS.md). What matters for the API:
- A weekly plan (`session_templates`) generates the real sessions of **next week** when someone opens the week view. The current week is never generated from the plans.
- Booking runs in a transaction that locks the session row. It is allowed while spots are left and the session is not cancelled or ended (also while it is ongoing).
- Ended sessions are read-only. Cancelled sessions stay in the week view with `state: cancelled`.
- Leaving the club removes the member's bookings on sessions that have not ended.

### Achievements
One achievement per user, club and code (409 on a duplicate). A leader can give any code by hand, including the ones that could be given automatically.