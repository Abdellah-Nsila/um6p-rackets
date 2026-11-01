-- CreateTable
CREATE TABLE "clubs" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "slug" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "avatar" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "clubs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "members" (
    "id" SERIAL NOT NULL,
    "club_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "role" INTEGER NOT NULL DEFAULT 0,
    "joined_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "left_at" TIMESTAMPTZ(6),

    CONSTRAINT "members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "achievements" (
    "id" SERIAL NOT NULL,
    "club_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "code" VARCHAR(50) NOT NULL,
    "awarded_by" INTEGER,
    "taken_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "achievements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "announcements" (
    "id" SERIAL NOT NULL,
    "club_id" INTEGER NOT NULL,
    "announcer_id" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "announcements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "session_templates" (
    "id" SERIAL NOT NULL,
    "club_id" INTEGER NOT NULL,
    "weekday" SMALLINT NOT NULL,
    "start_time" VARCHAR(5) NOT NULL,
    "duration_minutes" INTEGER NOT NULL,
    "title" VARCHAR(100),
    "location" VARCHAR(100),
    "capacity" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "session_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" SERIAL NOT NULL,
    "club_id" INTEGER NOT NULL,
    "template_id" INTEGER,
    "start_at" TIMESTAMPTZ(6) NOT NULL,
    "end_at" TIMESTAMPTZ(6) NOT NULL,
    "title" VARCHAR(100),
    "location" VARCHAR(100),
    "capacity" INTEGER NOT NULL,
    "cancelled_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "session_attends" (
    "id" SERIAL NOT NULL,
    "session_id" INTEGER NOT NULL,
    "member_id" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "session_attends_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "teams" (
    "id" SERIAL NOT NULL,
    "club_id" INTEGER NOT NULL,
    "player1_id" INTEGER NOT NULL,
    "player2_id" INTEGER,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "teams_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "matches" (
    "id" SERIAL NOT NULL,
    "club_id" INTEGER NOT NULL,
    "team1_id" INTEGER NOT NULL,
    "team2_id" INTEGER NOT NULL,
    "winner_id" INTEGER,
    "ref_id" INTEGER,
    "team1_score" INTEGER NOT NULL DEFAULT 0,
    "team2_score" INTEGER NOT NULL DEFAULT 0,
    "team1_points" INTEGER NOT NULL DEFAULT 0,
    "team2_points" INTEGER NOT NULL DEFAULT 0,
    "mode" INTEGER NOT NULL,
    "status" SMALLINT NOT NULL DEFAULT 0,
    "scheduled_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "matches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "club_documents" (
    "id" SERIAL NOT NULL,
    "club_id" INTEGER NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "path" TEXT NOT NULL,

    CONSTRAINT "club_documents_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "clubs_name_key" ON "clubs"("name");

-- CreateIndex
CREATE UNIQUE INDEX "clubs_slug_key" ON "clubs"("slug");

-- CreateIndex
CREATE INDEX "members_user_id_idx" ON "members"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "members_club_id_user_id_key" ON "members"("club_id", "user_id");

-- CreateIndex
CREATE INDEX "achievements_user_id_idx" ON "achievements"("user_id");

-- CreateIndex
CREATE INDEX "achievements_club_id_taken_at_idx" ON "achievements"("club_id", "taken_at" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "achievements_club_id_user_id_code_key" ON "achievements"("club_id", "user_id", "code");

-- CreateIndex
CREATE INDEX "announcements_club_id_created_at_idx" ON "announcements"("club_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "session_templates_club_id_weekday_idx" ON "session_templates"("club_id", "weekday");

-- CreateIndex
CREATE INDEX "sessions_club_id_start_at_idx" ON "sessions"("club_id", "start_at");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_template_id_start_at_key" ON "sessions"("template_id", "start_at");

-- CreateIndex
CREATE INDEX "session_attends_member_id_idx" ON "session_attends"("member_id");

-- CreateIndex
CREATE UNIQUE INDEX "session_attends_session_id_member_id_key" ON "session_attends"("session_id", "member_id");

-- CreateIndex
CREATE INDEX "matches_club_id_status_scheduled_at_idx" ON "matches"("club_id", "status", "scheduled_at");

-- AddForeignKey
ALTER TABLE "members" ADD CONSTRAINT "members_club_id_fkey" FOREIGN KEY ("club_id") REFERENCES "clubs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "achievements" ADD CONSTRAINT "achievements_club_id_fkey" FOREIGN KEY ("club_id") REFERENCES "clubs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "achievements" ADD CONSTRAINT "achievements_awarded_by_fkey" FOREIGN KEY ("awarded_by") REFERENCES "members"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "announcements" ADD CONSTRAINT "announcements_club_id_fkey" FOREIGN KEY ("club_id") REFERENCES "clubs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "announcements" ADD CONSTRAINT "announcements_announcer_id_fkey" FOREIGN KEY ("announcer_id") REFERENCES "members"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "session_templates" ADD CONSTRAINT "session_templates_club_id_fkey" FOREIGN KEY ("club_id") REFERENCES "clubs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_club_id_fkey" FOREIGN KEY ("club_id") REFERENCES "clubs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "session_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "session_attends" ADD CONSTRAINT "session_attends_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "session_attends" ADD CONSTRAINT "session_attends_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "members"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "teams" ADD CONSTRAINT "teams_club_id_fkey" FOREIGN KEY ("club_id") REFERENCES "clubs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "teams" ADD CONSTRAINT "teams_player1_id_fkey" FOREIGN KEY ("player1_id") REFERENCES "members"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "teams" ADD CONSTRAINT "teams_player2_id_fkey" FOREIGN KEY ("player2_id") REFERENCES "members"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "matches" ADD CONSTRAINT "matches_club_id_fkey" FOREIGN KEY ("club_id") REFERENCES "clubs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "matches" ADD CONSTRAINT "matches_team1_id_fkey" FOREIGN KEY ("team1_id") REFERENCES "teams"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "matches" ADD CONSTRAINT "matches_team2_id_fkey" FOREIGN KEY ("team2_id") REFERENCES "teams"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "matches" ADD CONSTRAINT "matches_winner_id_fkey" FOREIGN KEY ("winner_id") REFERENCES "teams"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "matches" ADD CONSTRAINT "matches_ref_id_fkey" FOREIGN KEY ("ref_id") REFERENCES "members"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "club_documents" ADD CONSTRAINT "club_documents_club_id_fkey" FOREIGN KEY ("club_id") REFERENCES "clubs"("id") ON DELETE CASCADE ON UPDATE CASCADE;


-- Checks Prisma can't express
ALTER TABLE "session_templates"
  ADD CONSTRAINT "session_templates_capacity_check" CHECK ("capacity" > 0),
  ADD CONSTRAINT "session_templates_weekday_check"  CHECK ("weekday" BETWEEN 0 AND 6),
  ADD CONSTRAINT "session_templates_duration_check" CHECK ("duration_minutes" BETWEEN 1 AND 1440);

ALTER TABLE "sessions"
  ADD CONSTRAINT "sessions_capacity_check" CHECK ("capacity" > 0),
  ADD CONSTRAINT "sessions_time_check"     CHECK ("end_at" > "start_at");

ALTER TABLE "teams"   ADD CONSTRAINT teams_players_chk   CHECK (player1_id <> player2_id);
ALTER TABLE "matches" ADD CONSTRAINT matches_status_chk  CHECK (status IN (0, 1, 2, 3));
ALTER TABLE "matches" ADD CONSTRAINT matches_teams_chk   CHECK (team1_id <> team2_id);
ALTER TABLE "matches" ADD CONSTRAINT matches_winner_chk  CHECK (winner_id IS NULL OR (status = 2 AND winner_id IN (team1_id, team2_id)));

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
