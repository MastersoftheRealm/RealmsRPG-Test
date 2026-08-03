-- TASK-649 Phase 2 — Revoke excessive anon table grants (D1)
-- =============================================================================
-- Status: APPLIED 2026-08-03 on RealmsRPG-Test — replay: scripts/run-task-649-phase2.mjs
-- Project: RealmsRPG-Test (lbqhiwudvifmkjtkccdg)
-- Audit ref: archive/CODEBASE_AUDIT_2026-08-01.md §5.2 D1
--
-- Finding: `anon` has INSERT/UPDATE/DELETE/TRUNCATE (and REFERENCES/TRIGGER) on
-- ~38 public tables. RLS blocks misuse today, but grants violate least privilege
-- (notably admin_role_audit, role_policies, user_* tables, backup tables).
--
-- Strategy:
--   1) REVOKE ALL table privileges from anon on public schema.
--   2) Re-GRANT SELECT only on tables with intentional public-read RLS policies
--      ("Anyone can read …" / official library read policies).
--   3) Leave `authenticated` and `service_role` grants unchanged.
--
-- Does NOT revoke anon EXECUTE on functions (separate hardening if needed).
-- Apply AFTER task-649-drop-codex-backup-tables-applied.sql (backup tables
-- should not receive SELECT re-grants).
--
-- Safe to re-run (idempotent REVOKE/GRANT).
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1) Strip all table privileges from anon on public
-- -----------------------------------------------------------------------------

REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon;

-- -----------------------------------------------------------------------------
-- 2) Re-grant SELECT on public-read reference / library tables only
--    (matches supabase-codex-rls-public.sql + official library + realms images)
-- -----------------------------------------------------------------------------

GRANT SELECT ON TABLE public.codex_feats TO anon;
GRANT SELECT ON TABLE public.codex_skills TO anon;
GRANT SELECT ON TABLE public.codex_species TO anon;
GRANT SELECT ON TABLE public.codex_traits TO anon;
GRANT SELECT ON TABLE public.codex_parts TO anon;
GRANT SELECT ON TABLE public.codex_properties TO anon;
GRANT SELECT ON TABLE public.codex_equipment TO anon;
GRANT SELECT ON TABLE public.codex_archetypes TO anon;
GRANT SELECT ON TABLE public.codex_archetype_levels TO anon;
GRANT SELECT ON TABLE public.codex_creature_feats TO anon;
GRANT SELECT ON TABLE public.core_rules TO anon;

GRANT SELECT ON TABLE public.official_creatures TO anon;
GRANT SELECT ON TABLE public.official_empowered_techniques TO anon;
GRANT SELECT ON TABLE public.official_enhanced_items TO anon;
GRANT SELECT ON TABLE public.official_items TO anon;
GRANT SELECT ON TABLE public.official_powers TO anon;
GRANT SELECT ON TABLE public.official_techniques TO anon;

GRANT SELECT ON TABLE public.realms_images TO anon;
GRANT SELECT ON TABLE public.realms_image_categories TO anon;

-- Public character sheets (guests): table grant here; RLS in
-- task-649-characters-anon-public-read-applied.sql (visibility = public only).
GRANT SELECT ON TABLE public.characters TO anon;

-- -----------------------------------------------------------------------------
-- Verification (run after apply)
-- -----------------------------------------------------------------------------
-- Expect: anon has SELECT only on the 20 tables above; no INSERT/UPDATE/DELETE/
-- TRUNCATE on any public table. VTT tables (vtt_*) intentionally excluded.
--
-- SELECT table_name, privilege_type
-- FROM information_schema.table_privileges
-- WHERE grantee = 'anon' AND table_schema = 'public'
-- ORDER BY table_name, privilege_type;
--
-- Smoke-test (anon key):
--   GET /api/codex (public codex read)
--   GET /api/official/* (public library)
--   GET /api/characters/[id] for visibility=public (guest, no sign-in)
--   Direct codex-art / portrait CDN URLs (bucket public=true; no listing)
--   Admin flows (service_role / authenticated session)
-- -----------------------------------------------------------------------------
