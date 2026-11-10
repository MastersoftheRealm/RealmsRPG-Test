-- =============================================================================
-- Deny authenticated direct INSERT/UPDATE on public.characters
-- =============================================================================
-- Symptom:
--   Owner INSERT and UPDATE policies let PostgREST callers bypass
--   create_character_relational / patch_character_relational, role quotas, and
--   assert_character_document_mapped field checks.
--
-- Fix:
--   Drop only the owner INSERT and UPDATE policies. Keep SELECT and DELETE.
--   SECURITY DEFINER save RPCs continue to insert and update the parent row.
--
-- Apply after Kadin explicit OK and a fresh backup (sql/README.md).
-- Safe to rerun. Rollback statements are at the bottom of this file.
-- =============================================================================

BEGIN;

ALTER TABLE public.characters ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can insert own characters" ON public.characters;
DROP POLICY IF EXISTS "Users can update own characters" ON public.characters;

COMMIT;

-- =============================================================================
-- Rollback — restore owner INSERT and UPDATE policies
-- =============================================================================
-- BEGIN;
--
-- ALTER TABLE public.characters ENABLE ROW LEVEL SECURITY;
--
-- DROP POLICY IF EXISTS "Users can insert own characters" ON public.characters;
-- CREATE POLICY "Users can insert own characters" ON public.characters
--   FOR INSERT TO authenticated
--   WITH CHECK (user_id = ((SELECT auth.uid())::text));
--
-- DROP POLICY IF EXISTS "Users can update own characters" ON public.characters;
-- CREATE POLICY "Users can update own characters" ON public.characters
--   FOR UPDATE TO authenticated
--   USING (user_id = ((SELECT auth.uid())::text))
--   WITH CHECK (user_id = ((SELECT auth.uid())::text));
--
-- COMMIT;
