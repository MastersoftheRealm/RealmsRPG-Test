-- =============================================================================
-- campaign_rolls: backfill created_at from data->>'timestamp'
-- =============================================================================
-- Legacy rows often have NULL created_at while JSONB carries `timestamp`.
-- NULLs sort first on ORDER BY created_at DESC, so LIMIT 50 returned an
-- arbitrary subset and hid new rolls. App POST now sets created_at; run this
-- once to fix existing rows (optional but recommended).
-- =============================================================================

UPDATE public.campaign_rolls
SET created_at = (data->>'timestamp')::timestamptz
WHERE created_at IS NULL
  AND (data->>'timestamp') IS NOT NULL
  AND (data->>'timestamp') ~ '^\d{4}-\d{2}-\d{2}';

-- Remaining NULL: sort oldest for retention trim / list tail
UPDATE public.campaign_rolls
SET created_at = TIMESTAMPTZ '1970-01-01'
WHERE created_at IS NULL;

-- Optional: DB default for any future non-app writers
-- ALTER TABLE public.campaign_rolls ALTER COLUMN created_at SET DEFAULT now();
