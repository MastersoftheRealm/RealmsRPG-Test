-- Assert live ACLs: anon must not EXECUTE unlisted public non-trigger functions (Supabase defaults).
BEGIN;

CREATE TEMP TABLE pgtap_anon_execute_allowlist (
  regprocedure text PRIMARY KEY,
  grant_source text NOT NULL,
  why text NOT NULL
) ON COMMIT DROP;

INSERT INTO pgtap_anon_execute_allowlist (regprocedure, grant_source, why) VALUES (
  'public.get_character_relational_document(text)',
  'sql/characters-relational-read-rpc.sql (GRANT EXECUTE TO anon, authenticated, service_role)',
  'Pending Kadin product decision: intentional anon read RPC today; INVOKER + characters RLS'
);

SELECT plan(2 * (SELECT count(*)::int FROM pgtap_anon_execute_allowlist) + 1);

SELECT ok(
  to_regprocedure(a.regprocedure) IS NOT NULL,
  format('allowlist entry exists: %s', a.regprocedure)
)
FROM pgtap_anon_execute_allowlist a;

SELECT ok(
  has_function_privilege('anon', a.regprocedure::regprocedure, 'EXECUTE'),
  format('allowlist entry is anon-executable: %s', a.regprocedure)
)
FROM pgtap_anon_execute_allowlist a;

SELECT bag_eq(
  (
    SELECT coalesce(
      array_agg(p.oid::regprocedure::text ORDER BY p.oid::regprocedure::text),
      ARRAY[]::text[]
    )
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.prorettype <> 'pg_catalog.trigger'::regtype
      AND p.prokind IN ('f', 'p')
      AND has_function_privilege('anon', p.oid, 'EXECUTE')
      AND NOT EXISTS (
        SELECT 1
        FROM pgtap_anon_execute_allowlist a
        WHERE a.regprocedure = p.oid::regprocedure::text
      )
  ),
  ARRAY[]::text[],
  'no unlisted public non-trigger functions are EXECUTE-able by anon'
);

SELECT * FROM finish();
ROLLBACK;