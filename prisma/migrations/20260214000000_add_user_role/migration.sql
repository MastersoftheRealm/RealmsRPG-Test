-- Ensure users schema exists and user tables live in it (shadow DB has them in public from init).
-- Idempotent: safe if schemas/tables were already moved or enum/column already exist.

CREATE SCHEMA IF NOT EXISTS users;

-- Move user-related tables from public to users if they still exist in public
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_profiles') THEN
    ALTER TABLE public.user_profiles SET SCHEMA users;
  END IF;
END $$;
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'usernames') THEN
    ALTER TABLE public.usernames SET SCHEMA users;
  END IF;
END $$;
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'characters') THEN
    ALTER TABLE public.characters SET SCHEMA users;
  END IF;
END $$;
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_powers') THEN
    ALTER TABLE public.user_powers SET SCHEMA users;
  END IF;
END $$;
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_techniques') THEN
    ALTER TABLE public.user_techniques SET SCHEMA users;
  END IF;
END $$;
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_items') THEN
    ALTER TABLE public.user_items SET SCHEMA users;
  END IF;
END $$;
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_creatures') THEN
    ALTER TABLE public.user_creatures SET SCHEMA users;
  END IF;
END $$;

-- Create enum only if it does not exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t
    JOIN pg_namespace n ON t.typnamespace = n.oid
    WHERE n.nspname = 'users' AND t.typname = 'UserRole'
  ) THEN
    CREATE TYPE "users"."UserRole" AS ENUM ('new_player', 'playtester', 'developer', 'admin');
  END IF;
END $$;

-- Add role column if not present
ALTER TABLE "users"."user_profiles" ADD COLUMN IF NOT EXISTS "role" "users"."UserRole" NOT NULL DEFAULT 'new_player';
