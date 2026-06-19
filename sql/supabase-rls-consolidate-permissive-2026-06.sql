-- TASK-352 — Consolidate duplicate permissive RLS policies (PERF-1 follow-up)
-- =============================================================================
-- Supabase performance advisor `multiple_permissive_policies` on:
--   public.campaign_members, public.campaigns, public.characters, public.role_policies
--
-- Strategy: one permissive policy per (table, command, role) with OR semantics.
-- Uses (select auth.uid()) initplan pattern throughout.
--
-- Preserves access:
--   - Campaign owner CRUD on own campaigns (no member UPDATE — TASK-329)
--   - Members read campaigns via owner_id, memberIds, or campaign_members
--   - campaign_members read/insert/delete for owner OR self
--   - characters SELECT: own, public visibility, campaign-shared roster
--   - role_policies: all authenticated read; admin INSERT/UPDATE/DELETE
--
-- Run via Supabase Dashboard SQL Editor or MCP apply_migration.
-- Re-check performance advisors after apply; spot-test campaign join + sheet cross-read.
--
-- IMPORTANT: After this script, run sql/supabase-rls-fix-campaign-recursion-2026-06.sql
-- (or use the merged version below). Cross-table campaign_members ↔ campaigns checks
-- must use SECURITY DEFINER helpers to avoid 42P17 infinite RLS recursion.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1) campaign_members — merge overlapping SELECT / INSERT / DELETE policies
-- -----------------------------------------------------------------------------

DROP POLICY IF EXISTS "Users can read own membership" ON public.campaign_members;
DROP POLICY IF EXISTS "Campaign owner can read members" ON public.campaign_members;
DROP POLICY IF EXISTS "Owner or self can insert member" ON public.campaign_members;
DROP POLICY IF EXISTS "Users can insert self membership" ON public.campaign_members;
DROP POLICY IF EXISTS "Campaign owner can delete members" ON public.campaign_members;
DROP POLICY IF EXISTS "Member can remove self" ON public.campaign_members;
DROP POLICY IF EXISTS "Users can delete self membership" ON public.campaign_members;
DROP POLICY IF EXISTS "Users can update self membership" ON public.campaign_members;

CREATE POLICY campaign_members_select_participants ON public.campaign_members
  FOR SELECT TO authenticated
  USING (
    user_id = (select auth.uid())::text
    OR EXISTS (
      SELECT 1 FROM public.campaigns c
      WHERE c.id = campaign_members.campaign_id
        AND c.owner_id = (select auth.uid())::text
    )
  );

CREATE POLICY campaign_members_insert_owner_or_self ON public.campaign_members
  FOR INSERT TO authenticated
  WITH CHECK (
    user_id = (select auth.uid())::text
    OR EXISTS (
      SELECT 1 FROM public.campaigns c
      WHERE c.id = campaign_members.campaign_id
        AND c.owner_id = (select auth.uid())::text
    )
  );

CREATE POLICY campaign_members_update_self ON public.campaign_members
  FOR UPDATE TO authenticated
  USING (user_id = (select auth.uid())::text)
  WITH CHECK (user_id = (select auth.uid())::text);

CREATE POLICY campaign_members_delete_owner_or_self ON public.campaign_members
  FOR DELETE TO authenticated
  USING (
    user_id = (select auth.uid())::text
    OR EXISTS (
      SELECT 1 FROM public.campaigns c
      WHERE c.id = campaign_members.campaign_id
        AND c.owner_id = (select auth.uid())::text
    )
  );

-- -----------------------------------------------------------------------------
-- 2) campaigns — split owner ALL; single SELECT for participants
-- -----------------------------------------------------------------------------

DROP POLICY IF EXISTS "Owner can do anything on own campaigns" ON public.campaigns;
DROP POLICY IF EXISTS "Users can create campaigns" ON public.campaigns;
DROP POLICY IF EXISTS "Members can read campaigns they belong to" ON public.campaigns;

CREATE POLICY campaigns_select_participants ON public.campaigns
  FOR SELECT TO authenticated
  USING (
    owner_id = (select auth.uid())::text
    OR "memberIds" @> jsonb_build_array((select auth.uid())::text)
    OR EXISTS (
      SELECT 1 FROM public.campaign_members m
      WHERE m.campaign_id = campaigns.id
        AND m.user_id = (select auth.uid())::text
    )
  );

CREATE POLICY campaigns_owner_insert ON public.campaigns
  FOR INSERT TO authenticated
  WITH CHECK (owner_id = (select auth.uid())::text);

CREATE POLICY campaigns_owner_update ON public.campaigns
  FOR UPDATE TO authenticated
  USING (owner_id = (select auth.uid())::text)
  WITH CHECK (owner_id = (select auth.uid())::text);

CREATE POLICY campaigns_owner_delete ON public.campaigns
  FOR DELETE TO authenticated
  USING (owner_id = (select auth.uid())::text);

-- -----------------------------------------------------------------------------
-- 3) characters — merge three SELECT policies; fix roster id match (characters.id)
-- -----------------------------------------------------------------------------

DROP POLICY IF EXISTS "Users can read own characters" ON public.characters;
DROP POLICY IF EXISTS "Authenticated can read public characters" ON public.characters;
DROP POLICY IF EXISTS "Authenticated can read campaign-shared characters" ON public.characters;

CREATE POLICY characters_select_authenticated ON public.characters
  FOR SELECT TO authenticated
  USING (
    user_id = (select auth.uid())::text
    OR COALESCE(data->>'visibility', '') = 'public'
    OR (
      COALESCE(data->>'visibility', '') = 'campaign'
      AND EXISTS (
        SELECT 1
        FROM public.campaigns c
        CROSS JOIN LATERAL jsonb_array_elements(
          CASE
            WHEN c.characters IS NULL THEN '[]'::jsonb
            WHEN jsonb_typeof(c.characters::jsonb) = 'array' THEN c.characters::jsonb
            ELSE '[]'::jsonb
          END
        ) AS elem
        WHERE
          (
            (
              elem ? 'characterId'
              AND elem->>'characterId' = characters.id::text
              AND elem->>'userId' = characters.user_id::text
            )
            OR (
              elem ? 'character_id'
              AND elem->>'character_id' = characters.id::text
              AND elem->>'user_id' = characters.user_id::text
            )
          )
          AND (
            c.owner_id::text = (select auth.uid())::text
            OR EXISTS (
              SELECT 1
              FROM public.campaign_members m
              WHERE m.campaign_id = c.id
                AND m.user_id::text = (select auth.uid())::text
            )
          )
      )
    )
  );

-- -----------------------------------------------------------------------------
-- 4) role_policies — admin ALL overlapped SELECT; split write-only policies
-- -----------------------------------------------------------------------------

DROP POLICY IF EXISTS role_policies_admin_write ON public.role_policies;

CREATE POLICY role_policies_admin_insert ON public.role_policies
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_profiles up
      WHERE up.id = (select auth.uid())::text
        AND up.role = 'admin'::public."UserRole"
    )
  );

CREATE POLICY role_policies_admin_update ON public.role_policies
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles up
      WHERE up.id = (select auth.uid())::text
        AND up.role = 'admin'::public."UserRole"
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_profiles up
      WHERE up.id = (select auth.uid())::text
        AND up.role = 'admin'::public."UserRole"
    )
  );

CREATE POLICY role_policies_admin_delete ON public.role_policies
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles up
      WHERE up.id = (select auth.uid())::text
        AND up.role = 'admin'::public."UserRole"
    )
  );

-- role_policies_select_authenticated (SELECT USING true) unchanged — one SELECT policy only
