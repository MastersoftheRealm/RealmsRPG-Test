-- =============================================================================
-- RealmsRPG — Supabase Storage RLS Policies
-- =============================================================================
-- Run in Supabase Dashboard → SQL Editor
-- Required for: /api/upload/portrait (portraits bucket) and profile picture uploads
-- Paths: portraits = {userId}/{characterId}.ext, profile-pictures = {userId}.ext
--
-- Safe to re-run: drops existing policies first, then creates them.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- PORTRAITS BUCKET
-- Path: {userId}/{characterId}.{ext} — first folder segment must match auth.uid()
-- -----------------------------------------------------------------------------

DROP POLICY IF EXISTS "Portraits are publicly readable" ON storage.objects;
-- Allow authenticated users to list/read any portrait (public URLs)
CREATE POLICY "Portraits are publicly readable"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'portraits');

DROP POLICY IF EXISTS "Users can upload own portraits" ON storage.objects;
-- Allow authenticated users to upload to their own folder only
CREATE POLICY "Users can upload own portraits"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'portraits'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

DROP POLICY IF EXISTS "Users can update own portraits" ON storage.objects;
-- Allow authenticated users to update (upsert) their own folder only
CREATE POLICY "Users can update own portraits"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'portraits'
  AND (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'portraits'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

DROP POLICY IF EXISTS "Users can delete own portraits" ON storage.objects;
-- Allow authenticated users to delete their own folder only
CREATE POLICY "Users can delete own portraits"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'portraits'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- -----------------------------------------------------------------------------
-- PROFILE-PICTURES BUCKET
-- Path: {userId}.{ext} — filename (before extension) must match auth.uid()
-- -----------------------------------------------------------------------------

DROP POLICY IF EXISTS "Users can upload own profile picture" ON storage.objects;
CREATE POLICY "Users can upload own profile picture"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'profile-pictures'
  AND name LIKE (auth.uid()::text || '.%')
);

DROP POLICY IF EXISTS "Profile pictures are publicly readable" ON storage.objects;
CREATE POLICY "Profile pictures are publicly readable"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'profile-pictures');

DROP POLICY IF EXISTS "Users can update own profile picture" ON storage.objects;
CREATE POLICY "Users can update own profile picture"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'profile-pictures'
  AND name LIKE (auth.uid()::text || '.%')
)
WITH CHECK (
  bucket_id = 'profile-pictures'
  AND name LIKE (auth.uid()::text || '.%')
);

DROP POLICY IF EXISTS "Users can delete own profile picture" ON storage.objects;
CREATE POLICY "Users can delete own profile picture"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'profile-pictures'
  AND name LIKE (auth.uid()::text || '.%')
);
