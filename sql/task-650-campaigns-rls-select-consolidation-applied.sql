-- TASK-650 — Drop redundant campaigns SELECT policy (D6 multiple_permissive_policies)
-- =============================================================================
-- Status: APPLIED 2026-08-03 on RealmsRPG-Test — replay: node scripts/run-task-650.mjs
-- Project: RealmsRPG-Test (lbqhiwudvifmkjtkccdg)
-- Audit ref: archive/CODEBASE_AUDIT_2026-08-01.md §5.2 D6
--
-- Finding: `public.campaigns` had two permissive SELECT policies for `authenticated`:
--   campaigns_owner_select        — owner_id = auth.uid()
--   campaigns_select_participants — private.auth_is_campaign_participant(id)
--
-- Origin: `campaigns_owner_select` was not in repo migrations — likely an ad-hoc split when
-- owner ALL was decomposed into per-command policies without dropping the ALL policy's SELECT arm.
--
-- The owner SELECT policy is redundant: auth_is_campaign_participant already grants
-- owners read access. Stacked permissive SELECT policies trigger Supabase performance
-- advisor `multiple_permissive_policies`.
--
-- Preserved access (unchanged):
--   SELECT — owner OR campaign_members participant (via private helper)
--   INSERT/UPDATE/DELETE — owner only (campaigns_owner_*)
--
-- Safe to re-run (idempotent DROP IF EXISTS).
-- =============================================================================

DROP POLICY IF EXISTS campaigns_owner_select ON public.campaigns;

-- Belt-and-suspenders: drop legacy names if a partial replay left them behind.
DROP POLICY IF EXISTS "Owner can do anything on own campaigns" ON public.campaigns;
DROP POLICY IF EXISTS "Members can read campaigns they belong to" ON public.campaigns;
DROP POLICY IF EXISTS "Members can read and update campaigns they belong to" ON public.campaigns;
