-- CreateTable
CREATE TABLE "join_requests" (
    "id" SERIAL NOT NULL,
    "club_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "status" SMALLINT NOT NULL DEFAULT 0,
    "requested_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "decided_at" TIMESTAMPTZ(6),
    "decided_by" INTEGER,

    CONSTRAINT "join_requests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "join_requests_club_id_status_requested_at_idx" ON "join_requests"("club_id", "status", "requested_at");

-- CreateIndex
CREATE UNIQUE INDEX "join_requests_club_id_user_id_key" ON "join_requests"("club_id", "user_id");

-- AddForeignKey
ALTER TABLE "join_requests" ADD CONSTRAINT "join_requests_club_id_fkey" FOREIGN KEY ("club_id") REFERENCES "clubs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "join_requests" ADD CONSTRAINT "join_requests_decided_by_fkey" FOREIGN KEY ("decided_by") REFERENCES "members"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "join_requests"
  ADD CONSTRAINT "join_requests_status_chk" CHECK ("status" BETWEEN 0 AND 3);