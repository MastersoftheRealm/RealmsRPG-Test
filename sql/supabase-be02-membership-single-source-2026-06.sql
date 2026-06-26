-- BE-02/06: campaign_members as the single source of truth for membership (2026-06)
-- =============================================================================
-- Collapses campaign membership onto the campaign_members table and removes the
-- redundant campaigns."memberIds" jsonb column.
--
-- Split into two parts so the column drop never races a deployed build that still
-- references it:
--   Part A (non-destructive): backfill + rewrite authz function and RLS policies so
--     nothing references memberIds. Apply, then deploy the app (which no longer
--     reads/writes the column).
--   Part B (destructive): drop the column. Apply only AFTER the Part A app deploy.
--
-- Recursion safety: campaigns SELECT routes through auth_is_campaign_participant and
-- campaign_members policies route through auth_is_campaign_owner. Both are
-- SECURITY DEFINER (bypass RLS), so there is no campaigns <-> campaign_members RLS
-- cycle (the 2026-06-19 42P17 hotfix introduced these helpers for exactly this reason).
--
-- Pre-checks (live, lbqhiwudvifmkjtkccdg): 15 memberId entries, 2 missing from the
-- table (1 owner [tracked via owner_id, intentionally not backfilled], 1 genuine
-- non-owner member [backfilled]), 0 uids absent from user_profiles.

-- ======================= PART A (non-destructive) =======================

-- 1) Backfill genuine non-owner members missing from the table.
INSERT INTO public.campaign_members (campaign_id, user_id)
SELECT c.id, m.uid
FROM public.campaigns c
CROSS JOIN LATERAL jsonb_array_elements_text(
  CASE WHEN jsonb_typeof(c."memberIds") = 'array' THEN c."memberIds" ELSE '[]'::jsonb END
) AS m(uid)
WHERE m.uid IS NOT NULL AND m.uid <> '' AND m.uid <> c.owner_id
ON CONFLICT (campaign_id, user_id) DO NOTHING;

-- 2) Drop memberIds from the participant check (owner OR campaign_members only).
CREATE OR REPLACE FUNCTION public.auth_is_campaign_participant(p_campaign_id text)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.campaigns c
    WHERE c.id = p_campaign_id
      AND (
        c.owner_id = (select auth.uid())::text
        OR EXISTS (
          SELECT 1 FROM public.campaign_members m
          WHERE m.campaign_id = c.id
            AND m.user_id = (select auth.uid())::text
        )
      )
  );
$function$;

-- 3) campaigns SELECT: route through the SECURITY DEFINER participant helper.
DROP POLICY IF EXISTS campaigns_select_participants ON public.campaigns;
CREATE POLICY campaigns_select_participants ON public.campaigns
  FOR SELECT TO authenticated
  USING (auth_is_campaign_participant(id));

-- 4) campaign_rolls: replace inline memberIds/campaign_members checks with helpers.
DROP POLICY IF EXISTS "Campaign participants can read rolls" ON public.campaign_rolls;
CREATE POLICY "Campaign participants can read rolls" ON public.campaign_rolls
  FOR SELECT
  USING (auth_is_campaign_participant(campaign_id));

DROP POLICY IF EXISTS "Participants insert own rolls" ON public.campaign_rolls;
CREATE POLICY "Participants insert own rolls" ON public.campaign_rolls
  FOR INSERT
  WITH CHECK (user_id = (select auth.uid())::text AND auth_is_campaign_participant(campaign_id));

DROP POLICY IF EXISTS "Owner or author deletes rolls" ON public.campaign_rolls;
CREATE POLICY "Owner or author deletes rolls" ON public.campaign_rolls
  FOR DELETE
  USING (auth_is_campaign_owner(campaign_id) OR (user_id = (select auth.uid())::text AND auth_is_campaign_participant(campaign_id)));

-- ======================= PART B (destructive) =======================
-- Apply ONLY after the Part A application build is deployed (migration name:
-- be02_membership_single_source_part_b):
--
-- ALTER TABLE public.campaigns DROP COLUMN IF EXISTS "memberIds";
