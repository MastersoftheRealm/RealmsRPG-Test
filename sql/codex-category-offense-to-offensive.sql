-- Stored codex category Offense → Offensive (codex_feats + codex_parts).
--
-- Targets: public.codex_feats.category and public.codex_parts.category only.
-- Rows with any other category value are unchanged. Rows are updated, not deleted.
--
-- Deployment order (required):
--   1. Kadin-approved backup, then run this script on the target database.
--   2. Deploy the application build that removes normalizeFeatCategory (same PR as this file).
--
-- This PR does not apply the script to production. Apply via Supabase Dashboard or
-- MCP apply_migration on the approved project only after backup.
--
-- Idempotent: safe to re-run; second run updates zero rows when no Offense remains.

BEGIN;

UPDATE public.codex_feats
SET category = 'Offensive'
WHERE category = 'Offense';

UPDATE public.codex_parts
SET category = 'Offensive'
WHERE category = 'Offense';

COMMIT;
