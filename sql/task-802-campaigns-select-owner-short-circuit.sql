-- TASK-802 — campaigns SELECT must see the owner on INSERT … RETURNING
-- =============================================================================
-- Status: APPLIED 2026-08-15 on RealmsRPG-Test (lbqhiwudvifmkjtkccdg)
-- Replay: this file (idempotent DROP + CREATE)
--
-- Bug: After TASK-650 dropped `campaigns_owner_select`, the only SELECT policy
-- was `private.auth_is_campaign_participant(id)` (STABLE SECURITY DEFINER).
-- INSERT … RETURNING evaluates SELECT RLS against the new row. The STABLE
-- helper looks up `public.campaigns` and cannot see the in-flight insert, so
-- Postgres raises: new row violates row-level security policy for table
-- "campaigns". Live error: 2026-08-15T17:15:54Z.
--
-- Fix: keep a single SELECT policy (no `multiple_permissive_policies`) and
-- short-circuit owners with `owner_id = auth.uid()` evaluated on the NEW row.
-- Members still go through the helper. Do not restore `campaigns_owner_select`.
-- App create also supplies the id and skips RETURNING (defense in depth).
-- =============================================================================

DROP POLICY IF EXISTS campaigns_select_participants ON public.campaigns;

CREATE POLICY campaigns_select_participants ON public.campaigns
  FOR SELECT
  TO authenticated
  USING (
    owner_id = ((SELECT auth.uid())::text)
    OR private.auth_is_campaign_participant(id)
  );
