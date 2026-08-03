-- TASK-649 Phase 2 — anon read for public character sheets (applied 2026-08-03)
-- =============================================================================
-- Gap closure: GET /api/characters/[id] uses the anon-key server client. The
-- consolidated RLS policy `characters_select_authenticated` is TO authenticated
-- only, so guests could not load visibility=public sheets even though the API
-- intends to allow it.
--
-- Least privilege: anon may SELECT only rows where data.visibility = 'public'.
-- Table GRANT is in task-649-anon-least-privilege-applied.sql (step 2).
-- Owner library for public sheets still uses service_role in getOwnerLibraryForView.
--
-- Apply AFTER task-649-anon-least-privilege-applied.sql.
-- Safe to re-run.
-- =============================================================================

DROP POLICY IF EXISTS characters_select_public_anon ON public.characters;
CREATE POLICY characters_select_public_anon ON public.characters
  FOR SELECT TO anon
  USING (COALESCE(data->>'visibility', '') = 'public');
