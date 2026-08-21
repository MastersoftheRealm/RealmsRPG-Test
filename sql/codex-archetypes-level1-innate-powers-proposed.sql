-- APPLIED 2026-07-15 (TASK-473) — owner approved.
-- Adds recommended Innate Powers for path Level 1, parallel to level1_powers.
--
-- Why a new column (not path_data JSON alone):
--   Admin save + GET /api/codex compose path_data from level1_* columns.
--   saveArchetypeWithPath does not write legacy path_data JSONB for list fields.
--   Without this column, recommended innate powers cannot round-trip.
--
-- Field: level1_innate_powers TEXT (CSV of official_powers ids), same shape as level1_powers.
-- Parsed app field: path_data.level1.innatePowers (string[]).

alter table public.codex_archetypes
  add column if not exists level1_innate_powers text;

comment on column public.codex_archetypes.level1_innate_powers is
  'CSV of official power ids recommended as Innate Powers at Level 1 (guided creator). Distinct from level1_powers.';

-- No backfill: lists start empty until content authors seed via admin.
