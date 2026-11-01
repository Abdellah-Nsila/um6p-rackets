-- AlterTable
ALTER TABLE "matches" ADD COLUMN     "cancelled_at" TIMESTAMPTZ(6),
ADD COLUMN     "cancelled_by" INTEGER,
ADD COLUMN     "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "location" VARCHAR(100);

-- AddForeignKey
ALTER TABLE "matches" ADD CONSTRAINT "matches_cancelled_by_fkey" FOREIGN KEY ("cancelled_by") REFERENCES "members"("id") ON DELETE SET NULL ON UPDATE CASCADE;
