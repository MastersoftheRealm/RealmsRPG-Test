-- =============================================================================
-- Path C Phase 0 — PART 2: RLS, Realtime, drop schemas
-- =============================================================================
-- Run AFTER Part 1a, 1b, 1c all succeed. All tables must already be in public.
--
-- Part 2 does: RLS for campaigns/campaign_members/campaign_rolls, Realtime add,
-- drop empty schemas (users, campaigns, codex, encounters).
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 4. Fix RLS: campaigns, campaign_members, campaign_rolls (reference public.*)
-- -----------------------------------------------------------------------------
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

-- campaign_members
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

-- campaign_rolls
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
-- PART 2 DONE. RLS and Realtime are set; empty schemas dropped.
-- Update Prisma schema to @@schema("public") and Realtime subscriptions to
-- schema: 'public', table: '...'.
-- =============================================================================
