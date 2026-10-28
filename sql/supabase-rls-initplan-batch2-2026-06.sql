-- TASK-354 — RLS initplan batch 2
-- Wrap auth.uid() as (select auth.uid()) for remaining per-row policies.

-- crafting_sessions
DROP POLICY IF EXISTS crafting_sessions_select ON public.crafting_sessions;
CREATE POLICY crafting_sessions_select ON public.crafting_sessions FOR SELECT
  USING ((select auth.uid()) = user_id);
DROP POLICY IF EXISTS crafting_sessions_insert ON public.crafting_sessions;
CREATE POLICY crafting_sessions_insert ON public.crafting_sessions FOR INSERT
  WITH CHECK ((select auth.uid()) = user_id);
DROP POLICY IF EXISTS crafting_sessions_update ON public.crafting_sessions;
CREATE POLICY crafting_sessions_update ON public.crafting_sessions FOR UPDATE
  USING ((select auth.uid()) = user_id) WITH CHECK ((select auth.uid()) = user_id);
DROP POLICY IF EXISTS crafting_sessions_delete ON public.crafting_sessions;
CREATE POLICY crafting_sessions_delete ON public.crafting_sessions FOR DELETE
  USING ((select auth.uid()) = user_id);

-- user_enhanced_items
DROP POLICY IF EXISTS user_enhanced_items_select ON public.user_enhanced_items;
CREATE POLICY user_enhanced_items_select ON public.user_enhanced_items FOR SELECT
  USING ((select auth.uid()) = user_id);
DROP POLICY IF EXISTS user_enhanced_items_insert ON public.user_enhanced_items;
CREATE POLICY user_enhanced_items_insert ON public.user_enhanced_items FOR INSERT
  WITH CHECK ((select auth.uid()) = user_id);
DROP POLICY IF EXISTS user_enhanced_items_update ON public.user_enhanced_items;
CREATE POLICY user_enhanced_items_update ON public.user_enhanced_items FOR UPDATE
  USING ((select auth.uid()) = user_id) WITH CHECK ((select auth.uid()) = user_id);
DROP POLICY IF EXISTS user_enhanced_items_delete ON public.user_enhanced_items;
CREATE POLICY user_enhanced_items_delete ON public.user_enhanced_items FOR DELETE
  USING ((select auth.uid()) = user_id);

-- campaigns
DROP POLICY IF EXISTS "Owner can do anything on own campaigns" ON public.campaigns;
CREATE POLICY "Owner can do anything on own campaigns" ON public.campaigns FOR ALL
  USING (owner_id = (select auth.uid())::text)
  WITH CHECK (owner_id = (select auth.uid())::text);
DROP POLICY IF EXISTS "Users can create campaigns" ON public.campaigns;
CREATE POLICY "Users can create campaigns" ON public.campaigns FOR INSERT
  WITH CHECK (owner_id = (select auth.uid())::text);

-- campaign_members
DROP POLICY IF EXISTS "Users can insert self membership" ON public.campaign_members;
CREATE POLICY "Users can insert self membership" ON public.campaign_members FOR INSERT
  WITH CHECK (user_id = (select auth.uid())::text);
DROP POLICY IF EXISTS "Users can delete self membership" ON public.campaign_members;
CREATE POLICY "Users can delete self membership" ON public.campaign_members FOR DELETE
  USING (user_id = (select auth.uid())::text);
DROP POLICY IF EXISTS "Users can update self membership" ON public.campaign_members;
CREATE POLICY "Users can update self membership" ON public.campaign_members FOR UPDATE
  USING (user_id = (select auth.uid())::text) WITH CHECK (user_id = (select auth.uid())::text);
