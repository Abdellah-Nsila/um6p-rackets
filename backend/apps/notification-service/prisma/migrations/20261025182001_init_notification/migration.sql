-- CreateEnum
CREATE TYPE "SenderType" AS ENUM ('SYSTEM', 'USER');

-- CreateEnum
CREATE TYPE "NotificationCategory" AS ENUM ('CLUB', 'USER');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('JOIN_REQUESTED', 'JOIN_ACCEPTED', 'JOIN_REJECTED', 'CLUB_ANNOUNCEMENT');

-- CreateTable
CREATE TABLE "notifications" (
    "id" BIGSERIAL NOT NULL,
    "event_id" TEXT NOT NULL,
    "sender_type" "SenderType" NOT NULL,
    "sender_id" BIGINT,
    "sender_name" TEXT,
    "sender_avatar_url" TEXT,
    "category" "NotificationCategory" NOT NULL,
    "type" "NotificationType" NOT NULL,
    "club_id" BIGINT,
    "club_name" TEXT,
    "sent_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_receivers" (
    "id" BIGSERIAL NOT NULL,
    "notification_id" BIGINT NOT NULL,
    "receiver_user_id" BIGINT NOT NULL,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "read_at" TIMESTAMPTZ(6),

    CONSTRAINT "notification_receivers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "notifications_event_id_key" ON "notifications"("event_id");

-- CreateIndex
CREATE INDEX "notifications_category_id_idx" ON "notifications"("category", "id" DESC);

-- CreateIndex
CREATE INDEX "notifications_club_id_id_idx" ON "notifications"("club_id", "id" DESC);

-- CreateIndex
CREATE INDEX "notification_receivers_receiver_user_id_id_idx" ON "notification_receivers"("receiver_user_id", "id" DESC);

-- CreateIndex
CREATE INDEX "notification_receivers_receiver_user_id_is_read_idx" ON "notification_receivers"("receiver_user_id", "is_read");

-- CreateIndex
CREATE UNIQUE INDEX "notification_receivers_notification_id_receiver_user_id_key" ON "notification_receivers"("notification_id", "receiver_user_id");

-- AddForeignKey
ALTER TABLE "notification_receivers" ADD CONSTRAINT "notification_receivers_notification_id_fkey" FOREIGN KEY ("notification_id") REFERENCES "notifications"("id") ON DELETE CASCADE ON UPDATE CASCADE;
