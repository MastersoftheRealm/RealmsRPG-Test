-- BE-01: Unify user identity anchor (2026-06)
-- =============================================================================
-- Converges the two outlier user_* tables (crafting_sessions, user_enhanced_items)
-- from `user_id uuid REFERENCES auth.users(id)` onto the project-wide anchor used by
-- every other user_* table: `user_id text REFERENCES public.user_profiles(id)` with
-- `auth.uid()::text = user_id` RLS.
--
-- Pre-checks performed before applying (live, RealmsRPG-Test / lbqhiwudvifmkjtkccdg):
--   * crafting_sessions: 3 rows, user_enhanced_items: 2 rows.
--   * 0 orphaned user_id values vs public.user_profiles(id).
-- App code already passes the text uid (`user.uid`) for both insert and filter, so no
-- application changes are required by this migration.
--
-- Idempotent: drops FKs/policies first, only retypes the column if still uuid, rebuilds.
-- Apply via Supabase apply_migration (migration name: be01_unify_user_identity_text_fk).

-- ===== crafting_sessions =====
ALTER TABLE public.crafting_sessions DROP CONSTRAINT IF EXISTS crafting_sessions_user_id_fkey;
DROP POLICY IF EXISTS crafting_sessions_select ON public.crafting_sessions;
DROP POLICY IF EXISTS crafting_sessions_insert ON public.crafting_sessions;
DROP POLICY IF EXISTS crafting_sessions_update ON public.crafting_sessions;
DROP POLICY IF EXISTS crafting_sessions_delete ON public.crafting_sessions;

DO $$
BEGIN
  IF (SELECT data_type FROM information_schema.columns
      WHERE table_schema='public' AND table_name='crafting_sessions' AND column_name='user_id') = 'uuid' THEN
    ALTER TABLE public.crafting_sessions ALTER COLUMN user_id TYPE text USING user_id::text;
  END IF;
END $$;

ALTER TABLE public.crafting_sessions
  ADD CONSTRAINT crafting_sessions_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES public.user_profiles(id) ON UPDATE CASCADE ON DELETE CASCADE;

CREATE POLICY crafting_sessions_select ON public.crafting_sessions FOR SELECT USING ((SELECT auth.uid())::text = user_id);
CREATE POLICY crafting_sessions_insert ON public.crafting_sessions FOR INSERT WITH CHECK ((SELECT auth.uid())::text = user_id);
CREATE POLICY crafting_sessions_update ON public.crafting_sessions FOR UPDATE USING ((SELECT auth.uid())::text = user_id) WITH CHECK ((SELECT auth.uid())::text = user_id);
CREATE POLICY crafting_sessions_delete ON public.crafting_sessions FOR DELETE USING ((SELECT auth.uid())::text = user_id);

-- ===== user_enhanced_items =====
ALTER TABLE public.user_enhanced_items DROP CONSTRAINT IF EXISTS user_enhanced_items_user_id_fkey;
DROP POLICY IF EXISTS user_enhanced_items_select ON public.user_enhanced_items;
DROP POLICY IF EXISTS user_enhanced_items_insert ON public.user_enhanced_items;
DROP POLICY IF EXISTS user_enhanced_items_update ON public.user_enhanced_items;
DROP POLICY IF EXISTS user_enhanced_items_delete ON public.user_enhanced_items;

DO $$
BEGIN
  IF (SELECT data_type FROM information_schema.columns
      WHERE table_schema='public' AND table_name='user_enhanced_items' AND column_name='user_id') = 'uuid' THEN
    ALTER TABLE public.user_enhanced_items ALTER COLUMN user_id TYPE text USING user_id::text;
  END IF;
END $$;

ALTER TABLE public.user_enhanced_items
  ADD CONSTRAINT user_enhanced_items_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES public.user_profiles(id) ON UPDATE CASCADE ON DELETE CASCADE;

CREATE POLICY user_enhanced_items_select ON public.user_enhanced_items FOR SELECT USING ((SELECT auth.uid())::text = user_id);
CREATE POLICY user_enhanced_items_insert ON public.user_enhanced_items FOR INSERT WITH CHECK ((SELECT auth.uid())::text = user_id);
CREATE POLICY user_enhanced_items_update ON public.user_enhanced_items FOR UPDATE USING ((SELECT auth.uid())::text = user_id) WITH CHECK ((SELECT auth.uid())::text = user_id);
CREATE POLICY user_enhanced_items_delete ON public.user_enhanced_items FOR DELETE USING ((SELECT auth.uid())::text = user_id);
