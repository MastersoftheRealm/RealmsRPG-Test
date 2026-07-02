-- TASK-326 — Tighten Storage SELECT policies (SEC-1)
-- =============================================================================
-- Supabase security advisor: public buckets `portraits` and `profile-pictures`
-- had broad SELECT policies (bucket_id only) that allow unauthenticated listing
-- of all objects via the Storage API.
--
-- Fix: drop bucket-wide public SELECT. Authenticated users may SELECT only their
-- own paths (upload cleanup still uses .list() in own folder). Public read-by-key
-- (character portraits, profile avatars in the UI) continues to work when each
-- bucket is marked **Public bucket** in Dashboard → Storage → bucket settings
-- (CDN URLs bypass Storage RLS for direct object GETs).
--
-- Also wraps auth.uid() as (select auth.uid()) on write policies (initplan pattern).
--
-- Prerequisites:
--   * sql/supabase-storage-policies.sql already applied (or equivalent policies).
--   * Buckets `portraits` and `profile-pictures` remain **Public bucket** enabled.
--
-- Leaked-password protection (HIBP) is an Auth Dashboard setting — see
-- src/docs/DEPLOYMENT_AND_SECRETS_SUPABASE.md (not SQL).
--
-- Run in Supabase Dashboard → SQL Editor. Do NOT run against production without
-- backup. Safe to re-run (DROP POLICY IF EXISTS before CREATE).
-- =============================================================================

-- -----------------------------------------------------------------------------
-- PORTRAITS — remove bucket-wide public SELECT; scope SELECT to own folder
-- -----------------------------------------------------------------------------

DROP POLICY IF EXISTS "Portraits are publicly readable" ON storage.objects;

DROP POLICY IF EXISTS "Users can read own portraits" ON storage.objects;
CREATE POLICY "Users can read own portraits"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'portraits'
  AND (storage.foldername(name))[1] = (select auth.uid())::text
);

DROP POLICY IF EXISTS "Users can upload own portraits" ON storage.objects;
CREATE POLICY "Users can upload own portraits"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'portraits'
  AND (storage.foldername(name))[1] = (select auth.uid())::text
);

DROP POLICY IF EXISTS "Users can update own portraits" ON storage.objects;
CREATE POLICY "Users can update own portraits"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'portraits'
  AND (storage.foldername(name))[1] = (select auth.uid())::text
)
WITH CHECK (
  bucket_id = 'portraits'
  AND (storage.foldername(name))[1] = (select auth.uid())::text
);

DROP POLICY IF EXISTS "Users can delete own portraits" ON storage.objects;
CREATE POLICY "Users can delete own portraits"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'portraits'
  AND (storage.foldername(name))[1] = (select auth.uid())::text
);

-- -----------------------------------------------------------------------------
-- PROFILE-PICTURES — remove bucket-wide public SELECT; scope SELECT to own file
-- -----------------------------------------------------------------------------

DROP POLICY IF EXISTS "Profile pictures are publicly readable" ON storage.objects;

DROP POLICY IF EXISTS "Users can read own profile picture" ON storage.objects;
CREATE POLICY "Users can read own profile picture"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'profile-pictures'
  AND name LIKE ((select auth.uid())::text || '.%')
);

DROP POLICY IF EXISTS "Users can upload own profile picture" ON storage.objects;
CREATE POLICY "Users can upload own profile picture"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'profile-pictures'
  AND name LIKE ((select auth.uid())::text || '.%')
);

DROP POLICY IF EXISTS "Users can update own profile picture" ON storage.objects;
CREATE POLICY "Users can update own profile picture"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'profile-pictures'
  AND name LIKE ((select auth.uid())::text || '.%')
)
WITH CHECK (
  bucket_id = 'profile-pictures'
  AND name LIKE ((select auth.uid())::text || '.%')
);

DROP POLICY IF EXISTS "Users can delete own profile picture" ON storage.objects;
CREATE POLICY "Users can delete own profile picture"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'profile-pictures'
  AND name LIKE ((select auth.uid())::text || '.%')
);

-- -----------------------------------------------------------------------------
-- Verification (run after applying):
--   SELECT policyname, roles, cmd, qual
--   FROM pg_policies
--   WHERE schemaname = 'storage' AND tablename = 'objects'
--     AND (policyname ILIKE '%portrait%' OR policyname ILIKE '%profile picture%')
--   ORDER BY policyname;
-- Expect: no SELECT policy with qual = (bucket_id = 'portraits'::text) alone;
--   authenticated SELECT scoped to auth.uid() path; buckets still Public in UI.
-- Re-check Supabase Dashboard → Advisors → Security after apply.
-- -----------------------------------------------------------------------------
