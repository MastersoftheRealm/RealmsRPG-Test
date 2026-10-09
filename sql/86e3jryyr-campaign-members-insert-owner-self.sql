-- 86e3jryyr — campaign_members INSERT is owner-and-self only
-- =============================================================================
-- Status: APPLIED 2026-10-09 on RealmsRPG-Test (lbqhiwudvifmkjtkccdg)
-- Replay: this file (idempotent DROP + CREATE). Does not change SELECT or DELETE.
--
-- Product rule (Kadin, 2026-10-09): anyone with a valid invite code can join.
-- That code is the only way to join a campaign you do not own.
-- joinCampaignAction checks the code and writes with the service role, which
-- bypasses RLS. createCampaignAction still inserts the owner's own row with
-- the user client, because the caller owns the campaign they just created.
--
-- Before: campaign_members_insert_owner_or_self allowed
--   user_id = auth.uid() OR private.auth_is_campaign_owner(campaign_id)
-- so any signed-in user who knew a campaign id could insert themselves.
-- campaign_members_update_self let that user change campaign_id (the only
-- other column) and move the row onto another campaign.
-- =============================================================================

DROP POLICY IF EXISTS campaign_members_insert_owner_or_self
  ON public.campaign_members;

DROP POLICY IF EXISTS campaign_members_insert_owner_self
  ON public.campaign_members;

CREATE POLICY campaign_members_insert_owner_self
  ON public.campaign_members
  FOR INSERT
  TO authenticated
  WITH CHECK (
    private.auth_is_campaign_owner(campaign_id)
    AND user_id = ((SELECT auth.uid())::text)
  );

DROP POLICY IF EXISTS campaign_members_update_self
  ON public.campaign_members;
