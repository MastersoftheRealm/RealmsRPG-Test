-- user_profiles: ensure created_at and updated_at have DEFAULT now()
-- ================================================================
-- If your migration added NOT NULL to these columns without DEFAULT,
-- inserts that only supply id (e.g. ensure-user-profile) can still fail
-- in edge cases. Adding DEFAULT makes any minimal insert valid.
-- Run in Supabase Dashboard → SQL Editor.

ALTER TABLE public.user_profiles
  ALTER COLUMN created_at SET DEFAULT now(),
  ALTER COLUMN updated_at SET DEFAULT now();
