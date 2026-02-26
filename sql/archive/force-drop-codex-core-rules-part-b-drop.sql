-- =============================================================================
-- Part B only: Remove from Realtime + DROP codex.core_rules
-- =============================================================================
-- Run this RIGHT AFTER Part A (terminate) succeeds. Use a fresh SQL Editor tab
-- so no other tab holds the table open.
-- =============================================================================

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'codex' AND tablename = 'core_rules'
  ) THEN
    ALTER PUBLICATION supabase_realtime DROP TABLE codex.core_rules;
  END IF;
EXCEPTION
  WHEN undefined_table THEN NULL;
END $$;

DROP TABLE IF EXISTS codex.core_rules CASCADE;
