-- =============================================================================
-- Official Library — Columnar expansion (more columns, less JSONB)
-- =============================================================================
-- Run after supabase-official-library-public-schema.sql.
-- Adds columns for range, duration, area, damage (powers); backfills from payload.
-- Payload then holds mainly "parts" (and any extra keys). Same pattern can be
-- applied to techniques/items/creatures (see src/docs/OFFICIAL_LIBRARY_COLUMNAR_PLAN.md).
--
-- Run order: 1) supabase-official-library-public-schema.sql  2) this file.
-- Deploy app after running so POST /api/official/powers writes the new columns.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- official_powers: add range, duration, area, damage columns
-- -----------------------------------------------------------------------------
ALTER TABLE public.official_powers
  ADD COLUMN IF NOT EXISTS range_steps INTEGER,
  ADD COLUMN IF NOT EXISTS duration_type TEXT,
  ADD COLUMN IF NOT EXISTS duration_value INTEGER,
  ADD COLUMN IF NOT EXISTS area_type TEXT,
  ADD COLUMN IF NOT EXISTS area_level INTEGER,
  ADD COLUMN IF NOT EXISTS damage JSONB DEFAULT '[]';

-- Backfill from payload (safe to run multiple times)
UPDATE public.official_powers
SET
  range_steps = COALESCE(
    (payload->'range'->>'steps')::integer,
    range_steps
  ),
  duration_type = COALESCE(
    payload->'duration'->>'type',
    duration_type
  ),
  duration_value = COALESCE(
    (payload->'duration'->>'value')::integer,
    duration_value
  ),
  area_type = COALESCE(
    payload->'area'->>'type',
    area_type
  ),
  area_level = COALESCE(
    (payload->'area'->>'level')::integer,
    area_level
  ),
  damage = CASE
    WHEN payload ? 'damage' AND jsonb_array_length(payload->'damage') > 0
    THEN payload->'damage'
    ELSE COALESCE(damage, '[]'::jsonb)
  END
WHERE payload IS NOT NULL
  AND (range_steps IS NULL OR duration_type IS NULL OR damage = '[]' OR damage IS NULL);

-- Optional: strip range, duration, area, damage from payload to avoid duplication
-- (keeps parts and any other keys). Uncomment to shrink payload.
/*
UPDATE public.official_powers
SET payload = payload - 'range' - 'duration' - 'area' - 'damage' - 'createdAt' - 'updatedAt'
WHERE payload ? 'range' OR payload ? 'duration' OR payload ? 'area' OR payload ? 'damage';
*/
