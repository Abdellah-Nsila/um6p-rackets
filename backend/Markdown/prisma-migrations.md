# Prisma migrations

## What a migration is

`schema.prisma` describes the database as it should look **now**. A migration is one saved **step** that gets a database there, written as a SQL file.

```
apps/club-service/prisma/
├── schema.prisma                        the models (how it should look now)
└── migrations/
    ├── 20261010161909_init_club/
    │   └── migration.sql                CREATE TABLE ... + our CHECK rules
    ├── 20261012090000_add_xyz/
    │   └── migration.sql                ALTER TABLE ...
    └── migration_lock.toml
```

Prisma records which migrations a database already ran in the table `_prisma_migrations`.

Migration files are the **history of the database**. Commit them to git. With them you can rebuild any database from zero.

## Our setup: one Prisma config per service

Each service has its own `schema.prisma`, `prisma7.config.ts`, generated client and `DATABASE_URL` (its own Postgres schema, e.g. `club_schema`). So we never run `npx prisma ...` directly. We use the npm scripts, which pass `--config`:

```
npm run prisma:club -- <prisma command>
npm run prisma:auth -- <prisma command>
```

Everything after `--` goes to Prisma.

## Commands

| Command | What it does | When |
| :--- | :--- | :--- |
| `migrate dev --name x` | Creates a migration from schema changes and applies it | Dev, you changed `schema.prisma` |
| `migrate dev --create-only --name x` | Creates the migration file **without applying it** | Dev, when you must edit the SQL first |
| `migrate deploy` | Applies migrations that haven't run yet | Fresh database, CI, Docker, production |
| `migrate reset` | Drops everything and replays all migrations (**deletes data**) | Dev, to start clean |
| `generate` | Regenerates the TypeScript client | After a model change (`migrate dev` does it for you) |
| `studio` | Opens a web UI to browse the data | Dev |
| `db push` | Changes tables to match the schema with **no history** | Quick experiments only, never for club |

## What `migrate dev` does (the shadow database)

```
1. CREATE DATABASE prisma_shadow_xxx      needs the CREATEDB permission
2. replay all migration files on it        a clean, empty copy
3. compare that result with schema.prisma  work out the new SQL
4. DROP DATABASE prisma_shadow_xxx         deleted again
5. apply the new migration to your real database
```

- The shadow database is a throwaway scratch copy. Your real data is never touched.
- The Prisma **CLI** needs `CREATEDB`, not your running app. It connects as the user in `DATABASE_URL`.
- Without it you get: `P3014 ... permission denied to create database`.
- `migrate deploy` has no shadow database, so production does **not** need `CREATEDB`.
- `init.sh` grants `CREATEDB` only when `APP_ENV=development` is set on the Postgres container.

## Rules Prisma can't express (CHECK constraints)

Prisma can't describe `CHECK` rules, so we add them by hand to the migration SQL, **once**:

```bash
npm run prisma:club -- migrate dev --create-only --name init_club
# open migration.sql, paste the ALTER TABLE ... CHECK lines at the very END
npm run prisma:club -- migrate dev
```

- They must come **after** the `CREATE TABLE` lines, because the tables must exist first.
- Prisma ignores checks when it compares the schema with the database, so later migrations don't drop them.
- If a later migration drops or recreates a column or table used in a check, Postgres drops the check with it. Re-add it in that migration.
- A new rule goes in a new migration, never in an old file.

## Rules to remember

1. **Never edit a migration after it was applied.** Prisma stores a checksum and complains if it changed. Make a new migration instead.
2. **Commit `migrations/` to git.** Don't commit `generated/` (add it to `.gitignore`, rebuild with `generate`).
3. **Don't use `db push` for club.** It creates no files, so hand-written checks would never be created.
4. **Run `migrate deploy` automatically** before a service starts in Docker, CI and production. It only applies what's missing, so running it every time is safe.

## Common situations

| Situation | What to do |
| :--- | :--- |
| Database deleted or new volume | Init script recreates roles and schemas, then `migrate deploy` |
| Migrations folder deleted, database has tables | Prisma reports a mismatch and offers a reset (deletes data). Avoid. |
| Want to start over in dev | Delete the database (volume) and the migrations folder, then `migrate dev --name init_xxx`, re-add the checks |
| `P3014 permission denied to create database` | `ALTER ROLE <service_user> CREATEDB;` (dev only) |
| Types in code are out of date | `npm run prisma:club -- generate` |