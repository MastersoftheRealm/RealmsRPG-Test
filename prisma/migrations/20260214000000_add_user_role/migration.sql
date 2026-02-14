-- CreateEnum
CREATE TYPE "users"."UserRole" AS ENUM ('new_player', 'playtester', 'developer', 'admin');

-- AlterTable
ALTER TABLE "users"."user_profiles" ADD COLUMN IF NOT EXISTS "role" "users"."UserRole" NOT NULL DEFAULT 'new_player';
