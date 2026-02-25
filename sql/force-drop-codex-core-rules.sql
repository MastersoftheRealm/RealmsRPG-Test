-- =============================================================================
-- Force-drop codex.core_rules (run BEFORE Part 2 if Part 2 times out on codex)
-- =============================================================================
-- If this whole script times out, run the two parts separately:
--   1. Run sql/force-drop-codex-core-rules-part-a-terminate.sql (terminate blockers)
--   2. As soon as it succeeds, run sql/force-drop-codex-core-rules-part-b-drop.sql (drop table)
-- =============================================================================

-- 0. Terminate other sessions that have a lock on codex.core_rules (so DROP can get the lock)
DO $$
DECLARE
  r RECORD;
  _oid OID;
BEGIN
  SELECT c.oid INTO _oid
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'codex' AND c.relname = 'core_rules';
  IF _oid IS NULL THEN
    RETURN;  -- table already gone
  END IF;
  FOR r IN
    SELECT DISTINCT l.pid
    FROM pg_locks l
    WHERE l.relation = _oid AND l.pid != pg_backend_pid()
  LOOP
    PERFORM pg_terminate_backend(r.pid);
  END LOOP;
END $$;

-- 1. Remove from Realtime publication if present (releases any Realtime lock)
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

-- 2. Force-drop the table (policies go with it)
DROP TABLE IF EXISTS codex.core_rules CASCADE;
