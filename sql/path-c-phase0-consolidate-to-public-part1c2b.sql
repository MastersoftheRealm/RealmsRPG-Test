-- =============================================================================
-- Path C Phase 0 — PART 1c2b: Move public_items + public_creatures
-- =============================================================================
-- Run AFTER Part 1c2a succeeds. Then run Part 2.
-- =============================================================================

ALTER TABLE codex.public_items SET SCHEMA public;
ALTER TABLE codex.public_creatures SET SCHEMA public;

-- PART 1c2b DONE. Part 2 drop scripts were removed; do not run legacy schema-removal SQL from this repo.
