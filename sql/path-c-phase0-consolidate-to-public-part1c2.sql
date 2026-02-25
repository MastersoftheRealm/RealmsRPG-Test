-- =============================================================================
-- Path C Phase 0 — PART 1c2a: Move public_powers + public_techniques (only)
-- =============================================================================
-- Run AFTER Part 1c succeeds. Then run Part 1c2b, then Part 2.
-- NOTE: core_rules is NOT moved here (stuck table in codex; Part 2 drops codex
-- schema, then run sql/create-public-core-rules.sql and seed from data/core-rules).
-- =============================================================================

ALTER TABLE codex.public_powers SET SCHEMA public;
ALTER TABLE codex.public_techniques SET SCHEMA public;

-- PART 1c2a DONE. Run Part 1c2b next: path-c-phase0-consolidate-to-public-part1c2b.sql
