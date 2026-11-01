-- AlterTable
ALTER TABLE "users" ADD COLUMN     "reset_token_expiry" TIMESTAMP(3),
ADD COLUMN     "reset_token_hash" TEXT;
