-- =============================================================================
-- Campaign rolls: add list columns (character_id, user_id, type, title)
-- Keeps data JSONB for full roll payload. Backfill from data.
-- =============================================================================

ALTER TABLE public.campaign_rolls
  ADD COLUMN IF NOT EXISTS character_id TEXT,
  ADD COLUMN IF NOT EXISTS user_id TEXT,
  ADD COLUMN IF NOT EXISTS type TEXT,
  ADD COLUMN IF NOT EXISTS title TEXT;

UPDATE public.campaign_rolls
SET
  character_id = data->>'characterId',
  user_id = data->>'userId',
  type = data->>'type',
  title = data->>'title'
WHERE data IS NOT NULL
  AND (character_id IS NULL OR user_id IS NULL OR type IS NULL);
