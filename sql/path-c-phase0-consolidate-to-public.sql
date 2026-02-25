-- =============================================================================
-- Path C Phase 0: Consolidate all app tables into public schema
-- =============================================================================
-- Run this in Supabase Dashboard → SQL Editor. One-time migration.
--
-- What this does:
--   1. Removes campaign_rolls and characters from Realtime publication
--   2. Moves UserRole enum from users to public
--   3. Moves every table from users, campaigns, codex, encounters into public
--   4. Fixes RLS policies for campaigns, campaign_members, campaign_rolls to use public.*
--   5. Re-adds campaign_rolls and characters to Realtime (public.*)
--   6. Drops empty schemas (users, campaigns, codex, encounters)
--
-- Prerequisites: DB already has tables in users/campaigns/codex/encounters
-- (e.g. after running prisma/supabase-idempotent-full.sql).
--
-- After this: Update Prisma schema to @@schema("public") for all models so
-- the app keeps working until you remove Prisma in Path C Phases 1–6.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Remove tables from Realtime publication (so we can move them)
-- -----------------------------------------------------------------------------
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

-- -----------------------------------------------------------------------------
-- 2. Move UserRole enum to public (required before moving user_profiles)
-- -----------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_namespace n ON t.typnamespace = n.oid WHERE n.nspname = 'public' AND t.typname = 'UserRole') THEN
    CREATE TYPE public."UserRole" AS ENUM ('new_player', 'playtester', 'developer', 'admin');
  END IF;
END $$;

-- Point user_profiles.role at public.UserRole (must run while table is still in users)
ALTER TABLE users.user_profiles
  ALTER COLUMN role TYPE public."UserRole" USING role::text::public."UserRole";

DROP TYPE IF EXISTS users."UserRole";

-- -----------------------------------------------------------------------------
-- 3. Move tables to public (order respects foreign keys)
-- -----------------------------------------------------------------------------
-- users schema
ALTER TABLE users.user_profiles SET SCHEMA public;
ALTER TABLE users.usernames SET SCHEMA public;
ALTER TABLE users.characters SET SCHEMA public;
ALTER TABLE users.user_powers SET SCHEMA public;
ALTER TABLE users.user_techniques SET SCHEMA public;
ALTER TABLE users.user_items SET SCHEMA public;
ALTER TABLE users.user_creatures SET SCHEMA public;
ALTER TABLE users.user_species SET SCHEMA public;

-- campaigns schema
ALTER TABLE campaigns.campaigns SET SCHEMA public;
ALTER TABLE campaigns.campaign_members SET SCHEMA public;
ALTER TABLE campaigns.campaign_rolls SET SCHEMA public;

-- encounters schema
ALTER TABLE encounters.encounters SET SCHEMA public;

-- codex schema
ALTER TABLE codex.codex_feats SET SCHEMA public;
ALTER TABLE codex.codex_skills SET SCHEMA public;
ALTER TABLE codex.codex_species SET SCHEMA public;
ALTER TABLE codex.codex_traits SET SCHEMA public;
ALTER TABLE codex.codex_parts SET SCHEMA public;
ALTER TABLE codex.codex_properties SET SCHEMA public;
ALTER TABLE codex.codex_equipment SET SCHEMA public;
ALTER TABLE codex.codex_archetypes SET SCHEMA public;
ALTER TABLE codex.codex_creature_feats SET SCHEMA public;
ALTER TABLE codex.core_rules SET SCHEMA public;
ALTER TABLE codex.public_powers SET SCHEMA public;
ALTER TABLE codex.public_techniques SET SCHEMA public;
ALTER TABLE codex.public_items SET SCHEMA public;
ALTER TABLE codex.public_creatures SET SCHEMA public;

-- -----------------------------------------------------------------------------
-- 4. Fix RLS: campaigns, campaign_members, campaign_rolls (reference public.*)
--    Other tables keep their policies (they moved with the table).
-- -----------------------------------------------------------------------------
-- campaigns: drop member policies and recreate (reference public.campaigns / public.campaign_members)
DROP POLICY IF EXISTS "Members can read and update campaigns they belong to" ON public.campaigns;
DROP POLICY IF EXISTS "Members can update campaigns they belong to" ON public.campaigns;
DROP POLICY IF EXISTS "Members can read campaigns they belong to" ON public.campaigns;

CREATE POLICY "Members can read campaigns they belong to" ON public.campaigns
  FOR SELECT TO authenticated
  USING (
    owner_id = (SELECT auth.uid())::text
    OR campaigns."memberIds"::jsonb @> jsonb_build_array((SELECT auth.uid())::text)
    OR EXISTS (SELECT 1 FROM public.campaign_members m WHERE m.campaign_id = campaigns.id AND m.user_id = (SELECT auth.uid())::text)
  );

CREATE POLICY "Members can update campaigns they belong to" ON public.campaigns
  FOR UPDATE TO authenticated
  USING (
    owner_id = (SELECT auth.uid())::text
    OR campaigns."memberIds"::jsonb @> jsonb_build_array((SELECT auth.uid())::text)
    OR EXISTS (SELECT 1 FROM public.campaign_members m WHERE m.campaign_id = campaigns.id AND m.user_id = (SELECT auth.uid())::text)
  )
  WITH CHECK (
    owner_id = (SELECT auth.uid())::text
    OR campaigns."memberIds"::jsonb @> jsonb_build_array((SELECT auth.uid())::text)
    OR EXISTS (SELECT 1 FROM public.campaign_members m WHERE m.campaign_id = campaigns.id AND m.user_id = (SELECT auth.uid())::text)
  );

-- campaign_members: drop and recreate so they reference public.campaigns
DROP POLICY IF EXISTS "Users can read own membership" ON public.campaign_members;
DROP POLICY IF EXISTS "Campaign owner can read members" ON public.campaign_members;
DROP POLICY IF EXISTS "Owner or self can insert member" ON public.campaign_members;
DROP POLICY IF EXISTS "Campaign owner can delete members" ON public.campaign_members;
DROP POLICY IF EXISTS "Member can remove self" ON public.campaign_members;

CREATE POLICY "Users can read own membership" ON public.campaign_members FOR SELECT TO authenticated USING (user_id = (SELECT auth.uid())::text);
CREATE POLICY "Campaign owner can read members" ON public.campaign_members FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.campaigns c WHERE c.id = campaign_members.campaign_id AND c.owner_id = (SELECT auth.uid())::text));
CREATE POLICY "Owner or self can insert member" ON public.campaign_members FOR INSERT TO authenticated
  WITH CHECK (
    user_id = (SELECT auth.uid())::text
    OR EXISTS (SELECT 1 FROM public.campaigns c WHERE c.id = campaign_members.campaign_id AND c.owner_id = (SELECT auth.uid())::text)
  );
CREATE POLICY "Campaign owner can delete members" ON public.campaign_members FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.campaigns c WHERE c.id = campaign_members.campaign_id AND c.owner_id = (SELECT auth.uid())::text));
CREATE POLICY "Member can remove self" ON public.campaign_members FOR DELETE TO authenticated USING (user_id = (SELECT auth.uid())::text);

-- campaign_rolls: drop and recreate so they reference public.campaigns (and public.campaign_members)
DROP POLICY IF EXISTS "Campaign participants can read rolls" ON public.campaign_rolls;
DROP POLICY IF EXISTS "Campaign participants can insert rolls" ON public.campaign_rolls;
DROP POLICY IF EXISTS "Campaign participants can update rolls" ON public.campaign_rolls;
DROP POLICY IF EXISTS "Campaign participants can delete rolls" ON public.campaign_rolls;

CREATE POLICY "Campaign participants can read rolls" ON public.campaign_rolls FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.campaigns c
      WHERE c.id = campaign_rolls.campaign_id
      AND (c.owner_id = (SELECT auth.uid())::text OR c."memberIds"::jsonb @> jsonb_build_array((SELECT auth.uid())::text)
           OR EXISTS (SELECT 1 FROM public.campaign_members m WHERE m.campaign_id = c.id AND m.user_id = (SELECT auth.uid())::text))
    )
  );

CREATE POLICY "Campaign participants can insert rolls" ON public.campaign_rolls FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.campaigns c
      WHERE c.id = campaign_rolls.campaign_id
      AND (c.owner_id = (SELECT auth.uid())::text OR c."memberIds"::jsonb @> jsonb_build_array((SELECT auth.uid())::text)
           OR EXISTS (SELECT 1 FROM public.campaign_members m WHERE m.campaign_id = c.id AND m.user_id = (SELECT auth.uid())::text))
    )
  );

CREATE POLICY "Campaign participants can update rolls" ON public.campaign_rolls FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.campaigns c
      WHERE c.id = campaign_rolls.campaign_id
      AND (c.owner_id = (SELECT auth.uid())::text OR c."memberIds"::jsonb @> jsonb_build_array((SELECT auth.uid())::text)
           OR EXISTS (SELECT 1 FROM public.campaign_members m WHERE m.campaign_id = c.id AND m.user_id = (SELECT auth.uid())::text))
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.campaigns c
      WHERE c.id = campaign_rolls.campaign_id
      AND (c.owner_id = (SELECT auth.uid())::text OR c."memberIds"::jsonb @> jsonb_build_array((SELECT auth.uid())::text)
           OR EXISTS (SELECT 1 FROM public.campaign_members m WHERE m.campaign_id = c.id AND m.user_id = (SELECT auth.uid())::text))
    )
  );

CREATE POLICY "Campaign participants can delete rolls" ON public.campaign_rolls FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.campaigns c
      WHERE c.id = campaign_rolls.campaign_id
      AND (c.owner_id = (SELECT auth.uid())::text OR c."memberIds"::jsonb @> jsonb_build_array((SELECT auth.uid())::text)
           OR EXISTS (SELECT 1 FROM public.campaign_members m WHERE m.campaign_id = c.id AND m.user_id = (SELECT auth.uid())::text))
    )
  );

-- -----------------------------------------------------------------------------
-- 5. Realtime: add public.campaign_rolls and public.characters
-- -----------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'campaign_rolls') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.campaign_rolls;
  END IF;
END $$;
GRANT SELECT ON public.campaign_rolls TO authenticated;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'characters') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.characters;
  END IF;
END $$;
GRANT SELECT ON public.characters TO authenticated;

-- -----------------------------------------------------------------------------
-- 6. Drop empty schemas
-- -----------------------------------------------------------------------------
DROP SCHEMA IF EXISTS users CASCADE;
DROP SCHEMA IF EXISTS campaigns CASCADE;
DROP SCHEMA IF EXISTS codex CASCADE;
DROP SCHEMA IF EXISTS encounters CASCADE;

-- =============================================================================
-- DONE. All app tables are now in public. Realtime uses public.campaign_rolls
-- and public.characters. Update Prisma schema to @@schema("public") and
-- update Realtime subscriptions in app to schema: 'public', table: '...'.
-- =============================================================================
