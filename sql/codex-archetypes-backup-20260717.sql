-- Pre-enrichment snapshot of archetype path tables (guided-creator content pass).
-- APPLIED via Supabase MCP apply_migration `codex_archetypes_backup_20260717`
-- on RealmsRPG-Test (lbqhiwudvifmkjtkccdg) 2026-07-17.
--
-- Restore example (owner-only, after review):
--   TRUNCATE public.codex_archetypes;
--   INSERT INTO public.codex_archetypes SELECT * FROM public.codex_archetypes_backup_20260717;
--   (same pattern for codex_archetype_levels / _backup_20260717)

CREATE TABLE IF NOT EXISTS public.codex_archetypes_backup_20260717 AS
TABLE public.codex_archetypes;

CREATE TABLE IF NOT EXISTS public.codex_archetype_levels_backup_20260717 AS
TABLE public.codex_archetype_levels;

COMMENT ON TABLE public.codex_archetypes_backup_20260717 IS
  'Pre-enrichment snapshot of codex_archetypes before guided-creator path content pass (2026-07-17)';
COMMENT ON TABLE public.codex_archetype_levels_backup_20260717 IS
  'Pre-enrichment snapshot of codex_archetype_levels before guided-creator path content pass (2026-07-17)';
