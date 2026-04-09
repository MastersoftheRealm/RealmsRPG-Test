-- Preserve entered username casing while keeping canonical lowercase username.
ALTER TABLE public.user_profiles
ADD COLUMN IF NOT EXISTS username_display TEXT;

-- Backfill existing users so current UI can immediately display a value.
UPDATE public.user_profiles
SET username_display = username
WHERE username_display IS NULL
  AND username IS NOT NULL;
