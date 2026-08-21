-- TASK-649 Phase 2 — Drop stale codex archetype backup tables (D2)
-- =============================================================================
-- Status: APPLIED 2026-08-03 on RealmsRPG-Test
-- Project: RealmsRPG-Test (lbqhiwudvifmkjtkccdg)
-- Audit ref: archive/CODEBASE_AUDIT_2026-08-01.md §5.2 D2
--
-- Finding: Four backup tables remain in production from 2026-06-29 and 2026-07-17
-- enrichment passes. All have RLS enabled, zero policies, no primary key.
-- Row counts (live 2026-08-01): archetypes 12 each; archetype_levels 3 each.
--
-- Local restore scripts:
--   sql/codex-archetypes-backup-20260717.sql (20260717 pair)
--   (20260629 pair created during layer1 extensions — no standalone file)
--
-- Owner: confirm guided-creator enrichment is stable and no rollback needed.
-- Optional pre-drop export:
--   pg_dump --table=codex_archetypes_backup_20260717 ...
--
-- Apply BEFORE task-649-anon-least-privilege-applied.sql.
-- Safe to re-run (IF EXISTS).
-- =============================================================================

DROP TABLE IF EXISTS public.codex_archetypes_backup_20260629;
DROP TABLE IF EXISTS public.codex_archetype_levels_backup_20260629;
DROP TABLE IF EXISTS public.codex_archetypes_backup_20260717;
DROP TABLE IF EXISTS public.codex_archetype_levels_backup_20260717;

-- -----------------------------------------------------------------------------
-- Verification (run after apply)
-- -----------------------------------------------------------------------------
-- SELECT tablename FROM pg_tables
-- WHERE schemaname = 'public' AND tablename LIKE 'codex_%backup%';
-- Expect: 0 rows.
--
-- Re-check get_advisors: rls_enabled_no_policy + no_primary_key on backups cleared.
-- -----------------------------------------------------------------------------
