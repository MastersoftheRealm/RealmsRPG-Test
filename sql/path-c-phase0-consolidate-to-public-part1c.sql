-- =============================================================================
-- Path C Phase 0 — PART 1c (first half): Move CODEX reference tables to public
-- =============================================================================
-- Run AFTER Part 1b succeeds. Then run Part 1c2, then Part 2.
-- =============================================================================

ALTER TABLE codex.codex_feats SET SCHEMA public;
ALTER TABLE codex.codex_skills SET SCHEMA public;
ALTER TABLE codex.codex_species SET SCHEMA public;
ALTER TABLE codex.codex_traits SET SCHEMA public;
ALTER TABLE codex.codex_parts SET SCHEMA public;
ALTER TABLE codex.codex_properties SET SCHEMA public;
ALTER TABLE codex.codex_equipment SET SCHEMA public;
ALTER TABLE codex.codex_archetypes SET SCHEMA public;
ALTER TABLE codex.codex_creature_feats SET SCHEMA public;

-- PART 1c (first half) DONE. Run Part 1c2 next: path-c-phase0-consolidate-to-public-part1c2.sql
