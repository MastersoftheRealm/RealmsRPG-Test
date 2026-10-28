-- =============================================================================
-- Create public.core_rules table (Path C — after Part 2 drops codex schema)
-- =============================================================================
-- Run AFTER Path C Phase 0 Part 2 (so codex schema is dropped and the stuck
-- codex.core_rules table is gone). Creates a fresh core_rules table in public.
--
-- Then seed from JSON: run
--   node scripts/seed-core-rules.js --export-json   (generates data/core-rules/*.json from embedded CORE_RULES)
--   Loading core_rules on a database requires owner approval — see src/docs/ai/guide/07-database-operations.md
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.core_rules (
  id         TEXT PRIMARY KEY,
  data       JSONB NOT NULL,
  updated_at TIMESTAMP(3)
);

ALTER TABLE public.core_rules ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can read core rules" ON public.core_rules;
CREATE POLICY "Anyone can read core rules" ON public.core_rules
  FOR SELECT TO public USING (true);

-- Writes (INSERT/UPDATE/DELETE) go via service role or admin API only; no policies = bypass RLS.
