-- Normalize codex_feats.ability delimiters (slash → comma)
-- Migration: normalize_codex_feat_ability_delimiters (20260703144039)
-- Status: Applied on RealmsRPG-Test 2026-07-03 via Supabase MCP apply_migration.
--
-- App still accepts legacy slash-separated values on read (feat-ability.ts);
-- this one-time data fix standardizes stored TEXT to comma-separated names.
-- Idempotent: safe to re-run (0 rows match once applied).

UPDATE public.codex_feats
SET ability = trim(both from regexp_replace(ability, '\s*/\s*', ', ', 'g'))
WHERE ability IS NOT NULL
  AND ability LIKE '%/%';
