-- =============================================================================
-- Characters: add list columns for list/filter without parsing JSONB
-- Keeps data JSONB for full document. Backfill from data.
-- =============================================================================

ALTER TABLE public.characters
  ADD COLUMN IF NOT EXISTS name TEXT,
  ADD COLUMN IF NOT EXISTS level INTEGER,
  ADD COLUMN IF NOT EXISTS archetype_name TEXT,
  ADD COLUMN IF NOT EXISTS ancestry_name TEXT,
  ADD COLUMN IF NOT EXISTS status TEXT,
  ADD COLUMN IF NOT EXISTS visibility TEXT;

UPDATE public.characters
SET
  name = COALESCE(data->>'name', 'Unnamed'),
  level = COALESCE((data->>'level')::integer, 1),
  archetype_name = CASE
    WHEN data->'archetype'->>'name' IS NOT NULL THEN data->'archetype'->>'name'
    WHEN data->'archetype'->>'type' IS NOT NULL THEN (SELECT string_agg(initcap(w), ' ') FROM unnest(string_to_array(data->'archetype'->>'type', '-')) AS w)
    ELSE NULL
  END,
  ancestry_name = COALESCE(data->'ancestry'->>'name', data->>'species'),
  status = data->>'status',
  visibility = COALESCE(data->>'visibility', 'private')
WHERE data IS NOT NULL
  AND (name IS NULL OR level IS NULL);
