-- TASK-649 post-apply verification (advisor-parity checks)
-- Run: node scripts/verify-task-649.mjs

\echo '=== backup tables (expect 0) ==='
SELECT count(*) AS backup_tables FROM pg_tables
WHERE schemaname = 'public' AND tablename LIKE 'codex_%backup%';

\echo '=== anon SELECT grants (expect 20 tables) ==='
SELECT count(DISTINCT table_name) AS anon_select_tables
FROM information_schema.table_privileges
WHERE grantee = 'anon' AND table_schema = 'public' AND privilege_type = 'SELECT';

\echo '=== anon write grants (expect 0) ==='
SELECT count(*) AS anon_write_grants
FROM information_schema.table_privileges
WHERE grantee = 'anon' AND table_schema = 'public'
  AND privilege_type IN ('INSERT','UPDATE','DELETE','TRUNCATE');

\echo '=== characters anon policy ==='
SELECT policyname, roles FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'characters' AND policyname = 'characters_select_public_anon';

\echo '=== codex-art storage SELECT policies (expect 0) ==='
SELECT count(*) AS codex_art_select_policies FROM pg_policies
WHERE schemaname = 'storage' AND tablename = 'objects'
  AND cmd = 'SELECT' AND qual ILIKE '%codex-art%';

\echo '=== feat tag search_path (expect 4 rows, search_path=public) ==='
SELECT proname, proconfig FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND proname IN ('normalize_feat_tags','map_feat_tag_phase1','map_feat_tag_phase2','map_feat_tag_phase3');

\echo '=== realms_images FK index (D7 — expect 1) ==='
SELECT count(*) AS realms_images_fk_index FROM pg_indexes
WHERE schemaname = 'public' AND indexname = 'idx_realms_images_created_by';

\echo '=== vtt_actions FK index (skipped — expect 0) ==='
SELECT count(*) AS vtt_actions_fk_index FROM pg_indexes
WHERE schemaname = 'public' AND indexname = 'idx_vtt_actions_token_id';

\echo '=== rls enabled no policy on public tables (expect 0) ==='
SELECT count(*) AS rls_no_policy_tables
FROM pg_tables t
WHERE t.schemaname = 'public'
  AND t.rowsecurity = true
  AND NOT EXISTS (
    SELECT 1 FROM pg_policies p
    WHERE p.schemaname = t.schemaname AND p.tablename = t.tablename
  );

\echo '=== anon grants on sensitive tables (expect 0) ==='
SELECT count(*) AS anon_grants_on_admin_tables
FROM information_schema.table_privileges
WHERE grantee = 'anon' AND table_schema = 'public'
  AND table_name IN ('admin_role_audit', 'role_policies', 'user_profiles', 'campaigns')
  AND privilege_type = 'SELECT';
