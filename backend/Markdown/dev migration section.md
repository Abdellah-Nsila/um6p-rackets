## Database migrations (Prisma)

Each service has its own Prisma config and its own Postgres schema (`auth_schema`, `club_schema`, ...). Use the npm scripts, never `npx prisma` directly:

```bash
npm run prisma:club -- <prisma command>
npm run prisma:auth -- <prisma command>
```

More details: [prisma-migrations.md](./prisma-migrations.md)

### 1. Start Postgres in dev mode

`prisma migrate dev` needs a temporary "shadow" database, so the service users need `CREATEDB`. The init script grants it only when `APP_ENV=development` is set on the Postgres container.

```bash
# fresh start (deletes the old data)
docker compose down -v
docker compose up -d postgres
```

Already running Postgres and don't want to delete the volume? Run once instead:

```bash
docker compose exec <postgres-service> psql -U <POSTGRES_USER> -d postgres \
  -c "ALTER ROLE <club_user> CREATEDB;"
```

### 2. Check the env file

`apps/<service>/.env.development` has the service's own URL, with its schema:

```
DATABASE_URL=postgresql://<user>:<password>@127.0.0.1:5432/rackets_db?schema=<service>_schema
```

### 3. Generate the client

```bash
npm run prisma:club -- generate
```

### 4. First migration for a service

```bash
# create the migration file without applying it
npm run prisma:club -- migrate dev --create-only --name init_club

# open apps/club-service/prisma/migrations/<date>_init_club/migration.sql
# and paste the CHECK rules at the very END of the file (see below)

# apply it
npm run prisma:club -- migrate dev
```

CHECK rules for club (Prisma can't express them, add them once):

```sql
-- Checks Prisma can't express
ALTER TABLE "session_templates"
  ADD CONSTRAINT "session_templates_capacity_check" CHECK ("capacity" > 0),
  ADD CONSTRAINT "session_templates_weekday_check"  CHECK ("weekday" BETWEEN 0 AND 6),
  ADD CONSTRAINT "session_templates_duration_check" CHECK ("duration_minutes" BETWEEN 1 AND 1440);

ALTER TABLE "sessions"
  ADD CONSTRAINT "sessions_capacity_check" CHECK ("capacity" > 0),
  ADD CONSTRAINT "sessions_time_check"     CHECK ("end_at" > "start_at");

ALTER TABLE "teams"   ADD CONSTRAINT teams_players_chk   CHECK (player1_id <> player2_id);
ALTER TABLE "matches" ADD CONSTRAINT matches_status_chk  CHECK (status IN (0, 1, 2));
ALTER TABLE "matches" ADD CONSTRAINT matches_teams_chk   CHECK (team1_id <> team2_id);
ALTER TABLE "matches" ADD CONSTRAINT matches_winner_chk  CHECK (winner_id IS NULL OR (status = 2 AND winner_id IN (team1_id, team2_id)));
ALTER TABLE "join_requests"
  ADD CONSTRAINT "join_requests_status_chk" CHECK ("status" BETWEEN 0 AND 3);

CREATE OR REPLACE FUNCTION check_session_capacity() RETURNS trigger AS $$
DECLARE cap int; n int;
BEGIN
  SELECT capacity INTO cap FROM sessions WHERE id = NEW.session_id FOR UPDATE;
  SELECT count(*) INTO n FROM session_attends WHERE session_id = NEW.session_id;
  IF n >= cap THEN
    RAISE EXCEPTION 'session % is full', NEW.session_id USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END $$ LANGUAGE plpgsql;

CREATE TRIGGER session_attends_capacity_trg
  BEFORE INSERT ON session_attends
  FOR EACH ROW EXECUTE FUNCTION check_session_capacity();

ALTER TABLE "leaderboard" ADD CONSTRAINT "check_points_positive" CHECK (points >= 0);
ALTER TABLE "leaderboard" ADD CONSTRAINT "check_wins_positive" CHECK (wins >= 0);
ALTER TABLE "leaderboard" ADD CONSTRAINT "check_losses_positive" CHECK (losses >= 0);
ALTER TABLE "leaderboard" ADD CONSTRAINT "check_total_matches_positive" CHECK (total_matches >= 0);
ALTER TABLE "leaderboard" ADD CONSTRAINT "check_win_streak_positive" CHECK (win_streak >= 0);
ALTER TABLE "leaderboard" ADD CONSTRAINT "check_best_win_streak_positive" CHECK (best_win_streak >= 0);
```

### 5. Changing a model later

```bash
# edit schema.prisma, then:
npm run prisma:club -- migrate dev --name describe_the_change
```

Never edit a migration that was already applied. Make a new one.

### 6. Database recreated or a teammate cloned the repo

```bash
npm run prisma:club -- migrate deploy
```

It replays every migration file in order (tables and checks) on an empty schema.

### 7. Browse the data

```bash
npm run prisma:studio:club
```

### Troubleshooting

| Error                                            | Fix                                                                     |
| :----------------------------------------------- | :---------------------------------------------------------------------- |
| `P3014 ... permission denied to create database` | The service user needs `CREATEDB` (step 1)                              |
| Drift or "migration was modified"                | An applied migration was edited. Restore the file, make a new migration |
| Types out of date                                | `npm run prisma:club -- generate`                                       |
