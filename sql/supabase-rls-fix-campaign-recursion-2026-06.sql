-- Hotfix: TASK-352 regression — infinite RLS recursion on campaign_members
-- =============================================================================
-- Symptom: 42P17 "infinite recursion detected in policy for relation campaign_members"
-- on GET /api/characters and other routes that touch characters RLS.
--
-- Cause: campaigns_select_participants referenced campaign_members while
-- campaign_members policies referenced campaigns → circular RLS evaluation.
--
-- Fix:
--   1) SECURITY DEFINER helpers (bypass RLS for cross-table membership checks)
--   2) campaigns SELECT uses owner_id + memberIds only (no campaign_members subquery)
--   3) characters campaign visibility uses auth_is_campaign_participant()
--   4) campaign_members owner checks use auth_is_campaign_owner()
--
-- Also adds user_profiles.show_tooltips if missing (fixes /api/tooltips 500).
-- Applied live 2026-06-19 as migration rls_fix_campaign_members_recursion_2026_06.
-- =============================================================================

CREATE OR REPLACE FUNCTION public.auth_is_campaign_owner(p_campaign_id text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.campaigns c
    WHERE c.id = p_campaign_id
      AND c.owner_id = (select auth.uid())::text
  );
$$;

CREATE OR REPLACE FUNCTION public.auth_is_campaign_participant(p_campaign_id text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.campaigns c
    WHERE c.id = p_campaign_id
      AND (
        c.owner_id = (select auth.uid())::text
        OR c."memberIds" @> jsonb_build_array((select auth.uid())::text)
        OR EXISTS (
          SELECT 1 FROM public.campaign_members m
          WHERE m.campaign_id = c.id
            AND m.user_id = (select auth.uid())::text
        )
      )
  );
$$;

REVOKE ALL ON FUNCTION public.auth_is_campaign_owner(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.auth_is_campaign_participant(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.auth_is_campaign_owner(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.auth_is_campaign_participant(text) TO authenticated;

DROP POLICY IF EXISTS campaign_members_select_participants ON public.campaign_members;
CREATE POLICY campaign_members_select_participants ON public.campaign_members
  FOR SELECT TO authenticated
  USING (
    user_id = (select auth.uid())::text
    OR public.auth_is_campaign_owner(campaign_members.campaign_id)
  );

DROP POLICY IF EXISTS campaign_members_insert_owner_or_self ON public.campaign_members;
CREATE POLICY campaign_members_insert_owner_or_self ON public.campaign_members
  FOR INSERT TO authenticated
  WITH CHECK (
    user_id = (select auth.uid())::text
    OR public.auth_is_campaign_owner(campaign_members.campaign_id)
  );

DROP POLICY IF EXISTS campaign_members_delete_owner_or_self ON public.campaign_members;
CREATE POLICY campaign_members_delete_owner_or_self ON public.campaign_members
  FOR DELETE TO authenticated
  USING (
    user_id = (select auth.uid())::text
    OR public.auth_is_campaign_owner(campaign_members.campaign_id)
  );

DROP POLICY IF EXISTS campaigns_select_participants ON public.campaigns;
CREATE POLICY campaigns_select_participants ON public.campaigns
  FOR SELECT TO authenticated
  USING (
    owner_id = (select auth.uid())::text
    OR "memberIds" @> jsonb_build_array((select auth.uid())::text)
  );

DROP POLICY IF EXISTS characters_select_authenticated ON public.characters;
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
          AND public.auth_is_campaign_participant(c.id::text)
      )
    )
  );

ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS show_tooltips BOOLEAN NOT NULL DEFAULT true;
