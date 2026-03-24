-- =============================================================================
-- campaign_members — table GRANTS for authenticated users
-- =============================================================================
-- Symptom in Supabase logs: "permission denied for table campaign_members"
-- Cause: Table exists with RLS policies but `authenticated` has no table-level
--        privileges. Postgres denies access before RLS is evaluated.
-- Fix: GRANT SELECT, INSERT, UPDATE, DELETE (UPDATE needed for upsert/on conflict).
-- Run in Supabase SQL Editor (once per project).
-- =============================================================================

GRANT SELECT, INSERT, UPDATE, DELETE ON public.campaign_members TO authenticated;
GRANT ALL ON public.campaign_members TO service_role;
