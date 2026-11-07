-- =============================================================================
-- Campaign owner RLS hotfix — restore consolidated read and owner write policies
-- =============================================================================
-- Symptom:
--   createCampaignAction fails with:
--   42501 "new row violates row-level security policy for table \"campaigns\""
--
-- Why this helps:
--   The app creates campaigns with the authenticated Supabase client and inserts
--   owner_id = auth.uid(). It also asks PostgREST to return the inserted id, so
--   the new row must pass both INSERT WITH CHECK and the consolidated SELECT
--   policy. The owner check must inspect the in-flight row directly because the
--   participant helper cannot see it during INSERT ... RETURNING.
--
-- Safe to rerun. Keep one permissive SELECT policy for authenticated users; do
-- not restore the legacy campaigns_owner_select policy (TASK-650 / TASK-802).
-- =============================================================================

BEGIN;

ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.campaigns TO authenticated;
GRANT ALL ON public.campaigns TO service_role;

DROP POLICY IF EXISTS campaigns_owner_select ON public.campaigns;

DROP POLICY IF EXISTS campaigns_select_participants ON public.campaigns;
CREATE POLICY campaigns_select_participants ON public.campaigns
  FOR SELECT TO authenticated
  USING (
    owner_id = ((SELECT auth.uid())::text)
    OR private.auth_is_campaign_participant(id)
  );

DROP POLICY IF EXISTS campaigns_owner_insert ON public.campaigns;
CREATE POLICY campaigns_owner_insert ON public.campaigns
  FOR INSERT TO authenticated
  WITH CHECK (owner_id = (select auth.uid())::text);

DROP POLICY IF EXISTS campaigns_owner_update ON public.campaigns;
CREATE POLICY campaigns_owner_update ON public.campaigns
  FOR UPDATE TO authenticated
  USING (owner_id = (select auth.uid())::text)
  WITH CHECK (owner_id = (select auth.uid())::text);

DROP POLICY IF EXISTS campaigns_owner_delete ON public.campaigns;
CREATE POLICY campaigns_owner_delete ON public.campaigns
  FOR DELETE TO authenticated
  USING (owner_id = (select auth.uid())::text);

COMMIT;
