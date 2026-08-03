-- TASK-649 Phase 1 (draft) — Index hygiene: FK covers + unused-index review (D7/D8)
-- =============================================================================
-- Status: PROPOSED — owner review required before apply (Phase 2).
-- Project: RealmsRPG-Test (lbqhiwudvifmkjtkccdg)
-- Audit ref: archive/CODEBASE_AUDIT_2026-08-01.md §5.2 D7/D8
--
-- Part A (recommended apply): add covering indexes for two unindexed FKs flagged
-- by get_advisors performance lint 0001_unindexed_foreign_keys.
--
-- Part B (review only): 29 indexes flagged unused (idx_scan = 0). Per audit and
-- TASK-649 AC, do NOT drop blindly — many are forward-looking (image_id joins,
-- FK support added in sql/supabase-rls-initplan-fk-indexes-2026-06.sql) or on
-- low-traffic tables. Drops are commented out; uncomment only after owner sign-off
-- and a fresh pg_stat_user_indexes review under real traffic.
--
-- Safe to re-run Part A (IF NOT EXISTS).
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Part A — Add missing FK indexes (apply-ready after owner approval)
-- -----------------------------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_realms_images_created_by
  ON public.realms_images (created_by);

CREATE INDEX IF NOT EXISTS idx_vtt_actions_token_id
  ON public.vtt_actions (token_id);

-- -----------------------------------------------------------------------------
-- Part B — Unused indexes (get_advisors 2026-08-01, idx_scan = 0)
-- DEFERRED — documentation for Phase 2 review; not applied by default.
-- -----------------------------------------------------------------------------

-- Image FK / lookup indexes (likely needed as image library adoption grows):
--   idx_codex_species_image_id, idx_codex_equipment_image_id,
--   idx_official_creatures_image_id, idx_official_powers_image_id,
--   idx_official_techniques_image_id, idx_official_empowered_techniques_image_id,
--   idx_official_items_image_id, idx_user_powers_image_id,
--   idx_user_techniques_image_id, idx_user_empowered_techniques_image_id,
--   idx_user_species_image_id, idx_user_creatures_image_id, idx_user_items_image_id

-- FK-support indexes from prior hardening (keep unless proven redundant):
--   idx_role_policies_updated_by, idx_usernames_user_id

-- Realms image library search indexes (table young, low traffic):
--   idx_realms_images_name_ilike, idx_realms_images_created_at

-- Official library filter indexes (may serve admin/codex pickers):
--   official_items_type_rarity_idx, official_powers_action_type_idx,
--   official_techniques_action_type_idx

-- Other:
--   idx_admin_role_audit_target, idx_crafting_sessions_updated_at,
--   idx_user_enhanced_items_updated_at, idx_user_enhanced_items_user_id

-- Optional drops — ONLY if owner confirms table/query patterns after traffic review.
-- Table official_enhanced_items has 0 rows today; indexes are pure overhead until
-- data lands. Uncomment as a bundle if desired:

-- DROP INDEX IF EXISTS public.idx_official_enhanced_items_name;
-- DROP INDEX IF EXISTS public.idx_official_enhanced_items_base_item_name;
-- DROP INDEX IF EXISTS public.idx_official_enhanced_items_power_name;
-- DROP INDEX IF EXISTS public.idx_official_enhanced_items_rarity;
-- DROP INDEX IF EXISTS public.idx_official_enhanced_items_updated_at;

-- -----------------------------------------------------------------------------
-- Verification (run after Part A apply)
-- -----------------------------------------------------------------------------
-- SELECT indexrelid::regclass, idx_scan
-- FROM pg_stat_user_indexes
-- WHERE indexrelid::regclass::text IN (
--   'idx_realms_images_created_by', 'idx_vtt_actions_token_id'
-- );
--
-- Re-check get_advisors: unindexed_foreign_keys on realms_images + vtt_actions cleared.
--
-- Refresh unused-index stats before any Part B drops:
-- SELECT indexrelid::regclass AS index_name, idx_scan,
--        pg_size_pretty(pg_relation_size(indexrelid)) AS size
-- FROM pg_stat_user_indexes
-- WHERE schemaname = 'public' AND idx_scan = 0
-- ORDER BY pg_relation_size(indexrelid) DESC;
-- -----------------------------------------------------------------------------
