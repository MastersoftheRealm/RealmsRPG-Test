-- =============================================================================
-- Path C Phase 0 — PART 1c2b: Move public_items + public_creatures
-- =============================================================================
-- Run AFTER Part 1c2a succeeds. Then run Part 2.
-- =============================================================================

ALTER TABLE codex.public_items SET SCHEMA public;
ALTER TABLE codex.public_creatures SET SCHEMA public;

-- PART 1c2b DONE. Run Part 2 next: path-c-phase0-consolidate-to-public-part2.sql
