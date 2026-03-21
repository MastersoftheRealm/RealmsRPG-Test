-- =============================================================================
-- user_species — GRANT + RLS for authenticated users
-- =============================================================================
-- Symptom in Supabase logs: "permission denied for table user_species"
-- Cause: Table moved/created via SQL without GRANT to `authenticated` (Postgres
--        denies access before RLS runs). Also ensure RLS policies exist.
-- Run in Supabase SQL Editor (once per project).
-- =============================================================================

-- Table-level privileges (required for API routes using the user session)
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_species TO authenticated;
GRANT ALL ON public.user_species TO service_role;

-- Sequences if any (usually gen_random_uuid() for id — no sequence)
-- GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

ALTER TABLE public.user_species ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own species" ON public.user_species;
CREATE POLICY "Users can read own species"
  ON public.user_species FOR SELECT TO authenticated
  USING (user_id::text = (SELECT auth.uid())::text);

DROP POLICY IF EXISTS "Users can insert own species" ON public.user_species;
CREATE POLICY "Users can insert own species"
  ON public.user_species FOR INSERT TO authenticated
  WITH CHECK (user_id::text = (SELECT auth.uid())::text);

DROP POLICY IF EXISTS "Users can update own species" ON public.user_species;
CREATE POLICY "Users can update own species"
  ON public.user_species FOR UPDATE TO authenticated
  USING (user_id::text = (SELECT auth.uid())::text)
  WITH CHECK (user_id::text = (SELECT auth.uid())::text);

DROP POLICY IF EXISTS "Users can delete own species" ON public.user_species;
CREATE POLICY "Users can delete own species"
  ON public.user_species FOR DELETE TO authenticated
  USING (user_id::text = (SELECT auth.uid())::text);
