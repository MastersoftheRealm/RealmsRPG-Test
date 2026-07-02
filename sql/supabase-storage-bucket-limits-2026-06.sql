-- BE-03: Storage bucket hardening (portraits, profile-pictures)
-- =============================================================
-- The portrait/profile-picture buckets previously had no size or MIME limits.
-- This restricts them to images and a 5 MB cap, matching the application's own
-- limits (src/app/api/upload/*/route.ts MAX_SIZE = 5 MB) and the magic-byte
-- allow-list in src/lib/validate-image.ts (jpeg/png/gif/webp/bmp).
--
-- NOTE on path scoping: the storage INSERT policies already constrain writes to
-- the caller's own folder/prefix:
--   - portraits:        (storage.foldername(name))[1] = auth.uid()::text  -> {uid}/*
--   - profile-pictures: name LIKE auth.uid()::text || '.%'                -> {uid}.*
-- so no additional INSERT policy change is required.
--
-- Public read remains intentional (public character portraits / avatars served
-- via getPublicUrl). If private avatars are ever desired, set public=false and
-- switch the app to signed URLs.
--
-- Idempotent: safe to re-run.

UPDATE storage.buckets
SET file_size_limit = 5242880, -- 5 MB
    allowed_mime_types = ARRAY['image/jpeg','image/png','image/gif','image/webp','image/bmp']
WHERE id IN ('portraits', 'profile-pictures');
