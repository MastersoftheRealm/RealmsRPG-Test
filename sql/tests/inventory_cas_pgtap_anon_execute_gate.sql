-- Assert live ACLs: anon must not EXECUTE unlisted public non-trigger functions (Supabase defaults).
BEGIN;

SELECT plan(1);

-- Allowlist: pronames only. Every entry needs a reviewed reason (prod + pgTAP).
CREATE TEMP TABLE pgtap_anon_execute_allowlist (
  proname text PRIMARY KEY,
  why text NOT NULL
) ON COMMIT DROP;

INSERT INTO pgtap_anon_execute_allowlist (proname, why) VALUES
  (
    'get_character_relational_document',
    'Explicit GRANT in characters-relational-read-rpc.sql; INVOKER; visibility enforced via characters RLS when used through API'
  ),
  (
    'map_feat_tag_phase1',
    'Prod catalog tag migration helper; not loaded in pgTAP stack — allowlist for parity with live catalog'
  ),
  (
    'map_feat_tag_phase2',
    'Prod catalog tag migration helper; not loaded in pgTAP stack — allowlist for parity with live catalog'
  ),
  (
    'map_feat_tag_phase3',
    'Prod catalog tag migration helper; not loaded in pgTAP stack — allowlist for parity with live catalog'
  ),
  (
    'normalize_feat_tags',
    'Prod admin feat tag normalization RPC; server-action path — recommend revoking anon (see PR allowlist notes)'
  ),
  (
    '_official_power_rebuilt_mechanic_part_names',
    'Prod codex mechanic builder helper; not user-facing RPC — recommend revoking anon (see PR allowlist notes)'
  ),
  (
    'assert_character_library_owner',
    'ADR-0031 internal helper; relational-expand.sql — legacy anon EXECUTE until expand REVOKE follow-up'
  ),
  (
    'resolve_character_reference',
    'ADR-0031 internal helper; relational-expand.sql — legacy anon EXECUTE until expand REVOKE follow-up'
  ),
  (
    'sync_character_scalar_columns',
    'ADR-0031 internal helper; relational-expand.sql — legacy anon EXECUTE until expand REVOKE follow-up'
  ),
  (
    'insert_character_inventory_item',
    'ADR-0031 internal helper; relational-expand.sql — legacy anon EXECUTE until expand REVOKE follow-up'
  ),
  (
    'insert_character_trait_selection',
    'ADR-0031 internal helper; relational-expand.sql — legacy anon EXECUTE until expand REVOKE follow-up'
  ),
  (
    'assert_character_document_mapped',
    'ADR-0031 internal helper; relational-expand.sql — legacy anon EXECUTE until expand REVOKE follow-up'
  ),
  (
    'sync_character_child_tables',
    'ADR-0031 internal helper; relational-expand.sql — legacy anon EXECUTE until expand REVOKE follow-up'
  ),
  (
    'sync_character_data_compat_trigger',
    'Compat trigger function; expand/cutover — legacy anon EXECUTE until expand REVOKE follow-up'
  ),
  (
    'touch_character_from_child',
    'ADR-0031 child-table touch trigger; expand — legacy anon EXECUTE until expand REVOKE follow-up'
  ),
  (
    'sync_character_cutover_scalars',
    'ADR-0031 cutover helper; relational-cutover.sql — legacy anon EXECUTE until expand REVOKE follow-up'
  ),
  (
    'apply_character_relational_document',
    'ADR-0031 write helper; write-rpc.sql — legacy anon EXECUTE until expand REVOKE follow-up'
  );

SELECT is(
  (
    SELECT count(*)::bigint
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.prorettype <> 'pg_catalog.trigger'::regtype
      AND p.prokind IN ('f', 'p')
      AND has_function_privilege('anon', p.oid, 'EXECUTE')
      AND NOT EXISTS (
        SELECT 1 FROM pgtap_anon_execute_allowlist a WHERE a.proname = p.proname
      )
  ),
  0::bigint,
  'no unlisted public functions are EXECUTE-able by anon (pg_proc ACLs after inventory CAS apply)'
);

SELECT * FROM finish();
ROLLBACK;