-- =============================================================================
-- Path C Phase 0 — PART 1a: Realtime drop, enum, move USERS schema only
-- =============================================================================
-- Run FIRST. Wait for Success, then run Part 1b, then Part 1c, then Part 2.
-- Splitting into 1a/1b/1c avoids timeout (each run is shorter).
-- =============================================================================

-- 1. Remove from Realtime (so we can move)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'campaigns' AND tablename = 'campaign_rolls') THEN
    ALTER PUBLICATION supabase_realtime DROP TABLE campaigns.campaign_rolls;
  END IF;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'users' AND tablename = 'characters') THEN
    ALTER PUBLICATION supabase_realtime DROP TABLE users.characters;
  END IF;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- 2. UserRole enum to public
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_namespace n ON t.typnamespace = n.oid WHERE n.nspname = 'public' AND t.typname = 'UserRole') THEN
    CREATE TYPE public."UserRole" AS ENUM ('new_player', 'playtester', 'developer', 'admin');
  END IF;
END $$;
ALTER TABLE users.user_profiles ALTER COLUMN role DROP DEFAULT;
ALTER TABLE users.user_profiles ALTER COLUMN role TYPE public."UserRole" USING role::text::public."UserRole";
ALTER TABLE users.user_profiles ALTER COLUMN role SET DEFAULT 'new_player'::public."UserRole";
DROP TYPE IF EXISTS users."UserRole";

-- 3. Move users schema only
ALTER TABLE users.user_profiles SET SCHEMA public;
ALTER TABLE users.usernames SET SCHEMA public;
ALTER TABLE users.characters SET SCHEMA public;
ALTER TABLE users.user_powers SET SCHEMA public;
ALTER TABLE users.user_techniques SET SCHEMA public;
ALTER TABLE users.user_items SET SCHEMA public;
ALTER TABLE users.user_creatures SET SCHEMA public;
ALTER TABLE users.user_species SET SCHEMA public;

-- PART 1a DONE. Run Part 1b next: path-c-phase0-consolidate-to-public-part1b.sql
