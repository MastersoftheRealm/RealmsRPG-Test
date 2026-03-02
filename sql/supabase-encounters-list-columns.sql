-- =============================================================================
-- Encounters: add list columns (name, type, status) for filtering without JSONB
-- Keeps data JSONB for full document. Backfill from data.
-- =============================================================================

ALTER TABLE public.encounters
  ADD COLUMN IF NOT EXISTS name TEXT,
  ADD COLUMN IF NOT EXISTS type TEXT,
  ADD COLUMN IF NOT EXISTS status TEXT;

UPDATE public.encounters
SET
  name = COALESCE(data->>'name', 'Unnamed Encounter'),
  type = COALESCE(data->>'type', 'combat'),
  status = COALESCE(data->>'status', 'preparing')
WHERE data IS NOT NULL
  AND (name IS NULL OR type IS NULL OR status IS NULL);
