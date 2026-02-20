-- =============================================================================
-- RealmsRPG — Supabase Storage RLS Policies
-- =============================================================================
-- Run in Supabase Dashboard → SQL Editor
-- Required for: /api/upload/portrait (portraits bucket) and profile picture uploads
-- Paths: portraits = {userId}/{characterId}.ext, profile-pictures = {userId}.ext
--
-- If you already ran the snippet in DEPLOYMENT_AND_SECRETS_SUPABASE.md you will
-- have INSERT + SELECT for portraits. Add only the "Users can update own
-- portraits" and "Users can delete own portraits" policies (or drop existing
-- portrait policies and run this full file).
-- =============================================================================

-- -----------------------------------------------------------------------------
-- PORTRAITS BUCKET
-- Path: {userId}/{characterId}.{ext} — first folder segment must match auth.uid()
-- -----------------------------------------------------------------------------

-- Allow authenticated users to list/read any portrait (public URLs)
CREATE POLICY "Portraits are publicly readable"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'portraits');

-- Allow authenticated users to upload to their own folder only
CREATE POLICY "Users can upload own portraits"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'portraits'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

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

CREATE POLICY "Users can upload own profile picture"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'profile-pictures'
  AND name LIKE (auth.uid()::text || '.%')
);

CREATE POLICY "Profile pictures are publicly readable"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'profile-pictures');

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

CREATE POLICY "Users can delete own profile picture"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'profile-pictures'
  AND name LIKE (auth.uid()::text || '.%')
);
