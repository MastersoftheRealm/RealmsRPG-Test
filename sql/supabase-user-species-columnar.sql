-- =============================================================================
-- User species columnar (same columns as codex_species + user_id + payload)
-- Run once when migrating from id+data. Adds columns, backfills, drops data.
-- =============================================================================

-- Ensure user_species exists (may already exist with id, user_id, data, created_at, updated_at)
-- Add columnar columns
ALTER TABLE public.user_species
  ADD COLUMN IF NOT EXISTS name TEXT,
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS type TEXT,
  ADD COLUMN IF NOT EXISTS sizes TEXT,
  ADD COLUMN IF NOT EXISTS skills TEXT,
  ADD COLUMN IF NOT EXISTS species_traits TEXT,
  ADD COLUMN IF NOT EXISTS ancestry_traits TEXT,
  ADD COLUMN IF NOT EXISTS flaws TEXT,
  ADD COLUMN IF NOT EXISTS characteristics TEXT,
  ADD COLUMN IF NOT EXISTS ave_hgt_cm NUMERIC,
  ADD COLUMN IF NOT EXISTS ave_wgt_kg NUMERIC,
  ADD COLUMN IF NOT EXISTS adulthood_lifespan TEXT,
  ADD COLUMN IF NOT EXISTS languages TEXT,
  ADD COLUMN IF NOT EXISTS payload JSONB DEFAULT '{}';

-- Backfill from data (if data column exists), then drop data
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'user_species' AND column_name = 'data') THEN
    UPDATE public.user_species SET
      name = data->>'name',
      description = data->>'description',
      type = data->>'type',
      sizes = CASE WHEN data->'sizes' IS NOT NULL THEN (SELECT string_agg(elem::text, ',' ORDER BY ord) FROM jsonb_array_elements_text(data->'sizes') WITH ORDINALITY AS t(elem, ord)) ELSE data->>'sizes' END,
      skills = CASE WHEN data->'skills' IS NOT NULL THEN (SELECT string_agg(elem::text, ',' ORDER BY ord) FROM jsonb_array_elements_text(data->'skills') WITH ORDINALITY AS t(elem, ord)) ELSE data->>'skills' END,
      species_traits = CASE WHEN data->'species_traits' IS NOT NULL THEN (SELECT string_agg(elem::text, ',' ORDER BY ord) FROM jsonb_array_elements_text(data->'species_traits') WITH ORDINALITY AS t(elem, ord)) ELSE data->>'species_traits' END,
      ancestry_traits = CASE WHEN data->'ancestry_traits' IS NOT NULL THEN (SELECT string_agg(elem::text, ',' ORDER BY ord) FROM jsonb_array_elements_text(data->'ancestry_traits') WITH ORDINALITY AS t(elem, ord)) ELSE data->>'ancestry_traits' END,
      flaws = CASE WHEN data->'flaws' IS NOT NULL THEN (SELECT string_agg(elem::text, ',' ORDER BY ord) FROM jsonb_array_elements_text(data->'flaws') WITH ORDINALITY AS t(elem, ord)) ELSE data->>'flaws' END,
      characteristics = CASE WHEN data->'characteristics' IS NOT NULL THEN (SELECT string_agg(elem::text, ',' ORDER BY ord) FROM jsonb_array_elements_text(data->'characteristics') WITH ORDINALITY AS t(elem, ord)) ELSE data->>'characteristics' END,
      ave_hgt_cm = (data->>'ave_hgt_cm')::numeric,
      ave_wgt_kg = (data->>'ave_wgt_kg')::numeric,
      adulthood_lifespan = CASE WHEN jsonb_typeof(data->'adulthood_lifespan') = 'array' THEN (SELECT string_agg(elem::text, ',') FROM jsonb_array_elements_text(data->'adulthood_lifespan') AS t(elem)) ELSE data->>'adulthood_lifespan' END,
      languages = CASE WHEN data->'languages' IS NOT NULL THEN (SELECT string_agg(elem::text, ',' ORDER BY ord) FROM jsonb_array_elements_text(data->'languages') WITH ORDINALITY AS t(elem, ord)) ELSE data->>'languages' END,
      payload = COALESCE(data - 'name' - 'description' - 'type' - 'sizes' - 'skills' - 'species_traits' - 'ancestry_traits' - 'flaws' - 'characteristics' - 'ave_hgt_cm' - 'ave_wgt_kg' - 'adulthood_lifespan' - 'languages' - 'id' - 'createdAt' - 'updatedAt' - 'created_at' - 'updated_at', '{}'::jsonb)
    WHERE data IS NOT NULL;
    ALTER TABLE public.user_species DROP COLUMN data;
  END IF;
END $$;
