-- Optional payload JSONB on codex_species (parity with user_species) for fields not stored as columns.
-- Safe to run multiple times.
ALTER TABLE public.codex_species
  ADD COLUMN IF NOT EXISTS payload JSONB NOT NULL DEFAULT '{}'::jsonb;
