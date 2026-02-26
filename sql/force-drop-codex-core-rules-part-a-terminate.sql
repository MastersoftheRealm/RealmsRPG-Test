-- =============================================================================
-- Part A only: Terminate sessions locking codex.core_rules
-- =============================================================================
-- Run this FIRST if the full force-drop script times out.
-- As soon as you see "Success", run Part B (force-drop-codex-core-rules-part-b-drop.sql)
-- in the same or a new SQL Editor tab.
-- =============================================================================

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
    RAISE NOTICE 'codex.core_rules does not exist; nothing to terminate.';
    RETURN;
  END IF;
  FOR r IN
    SELECT DISTINCT l.pid
    FROM pg_locks l
    WHERE l.relation = _oid AND l.pid != pg_backend_pid()
  LOOP
    PERFORM pg_terminate_backend(r.pid);
    RAISE NOTICE 'Terminated backend %', r.pid;
  END LOOP;
END $$;
