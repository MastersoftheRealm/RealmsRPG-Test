-- TASK-327 — RLS initplan fixes + missing FK indexes (PERF-1)
-- =============================================================================
-- Supabase performance advisors:
--   1) auth_rls_initplan — wrap auth.uid() as (select auth.uid()) so Postgres
--      evaluates the JWT once per query, not once per row.
--   2) unindexed_foreign_keys — add indexes on FK columns used in joins/deletes.
--
-- Template (apply to any new RLS policy):
--   GOOD:  user_id = (select auth.uid())::text
--   BAD:   user_id = auth.uid()::text
--   BAD:   user_id = (auth.uid())::text   -- still per-row without outer SELECT
--
-- FOLLOW-UP (TASK-352, applied 2026-06-18): duplicate permissive policies on
-- campaign_members, campaigns, characters, role_policies — see
-- sql/supabase-rls-consolidate-permissive-2026-06.sql
--
-- Unused indexes on empty official_enhanced_items are intentionally left alone;
-- revisit after that table has production data.
--
-- Run in Supabase Dashboard → SQL Editor. Do NOT run against production without
-- backup. Safe to re-run (DROP POLICY IF EXISTS / CREATE INDEX IF NOT EXISTS).
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1) Missing FK indexes (unindexed_foreign_keys)
-- -----------------------------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_role_policies_updated_by
  ON public.role_policies (updated_by);

CREATE INDEX IF NOT EXISTS idx_ui_tooltips_updated_by
  ON public.ui_tooltips (updated_by);

CREATE INDEX IF NOT EXISTS idx_usernames_user_id
  ON public.usernames (user_id);

-- -----------------------------------------------------------------------------
-- 2) campaign_rolls — rewrite policies from supabase-campaign-authz-2026-06.sql
-- -----------------------------------------------------------------------------

DROP POLICY IF EXISTS "Participants insert own rolls" ON public.campaign_rolls;
CREATE POLICY "Participants insert own rolls" ON public.campaign_rolls
  FOR INSERT
  WITH CHECK (
    user_id = (select auth.uid())::text
    AND EXISTS (
      SELECT 1 FROM public.campaigns c
      WHERE c.id = campaign_rolls.campaign_id
        AND (
          c.owner_id = (select auth.uid())::text
          OR c."memberIds" @> jsonb_build_array((select auth.uid())::text)
          OR EXISTS (
            SELECT 1 FROM public.campaign_members m
            WHERE m.campaign_id = c.id AND m.user_id = (select auth.uid())::text
          )
        )
    )
  );

DROP POLICY IF EXISTS "Owner or author deletes rolls" ON public.campaign_rolls;
CREATE POLICY "Owner or author deletes rolls" ON public.campaign_rolls
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.campaigns c
      WHERE c.id = campaign_rolls.campaign_id
        AND (
          c.owner_id = (select auth.uid())::text
          OR (
            campaign_rolls.user_id = (select auth.uid())::text
            AND (
              c."memberIds" @> jsonb_build_array((select auth.uid())::text)
              OR EXISTS (
                SELECT 1 FROM public.campaign_members m
                WHERE m.campaign_id = c.id AND m.user_id = (select auth.uid())::text
              )
            )
          )
        )
    )
  );

-- -----------------------------------------------------------------------------
-- 3) admin_role_audit
-- -----------------------------------------------------------------------------

DROP POLICY IF EXISTS "Admins can read role audit" ON public.admin_role_audit;
CREATE POLICY "Admins can read role audit" ON public.admin_role_audit
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles up
      WHERE up.id = (select auth.uid())::text AND up.role = 'admin'
    )
  );

-- -----------------------------------------------------------------------------
-- 4) role_policies — admin write policy
-- -----------------------------------------------------------------------------

DROP POLICY IF EXISTS role_policies_admin_write ON public.role_policies;
CREATE POLICY role_policies_admin_write
  ON public.role_policies
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.user_profiles up
      WHERE up.id = (select auth.uid())::text
        AND up.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.user_profiles up
      WHERE up.id = (select auth.uid())::text
        AND up.role = 'admin'
    )
  );

-- -----------------------------------------------------------------------------
-- 5) ui_tooltips — admin write policies
-- -----------------------------------------------------------------------------

DROP POLICY IF EXISTS ui_tooltips_admin_insert ON public.ui_tooltips;
CREATE POLICY ui_tooltips_admin_insert
ON public.ui_tooltips
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.user_profiles up
    WHERE up.id::text = (select auth.uid())::text
      AND up.role = 'admin'
  )
);

DROP POLICY IF EXISTS ui_tooltips_admin_update ON public.ui_tooltips;
CREATE POLICY ui_tooltips_admin_update
ON public.ui_tooltips
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.user_profiles up
    WHERE up.id::text = (select auth.uid())::text
      AND up.role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.user_profiles up
    WHERE up.id::text = (select auth.uid())::text
      AND up.role = 'admin'
  )
);

DROP POLICY IF EXISTS ui_tooltips_admin_delete ON public.ui_tooltips;
CREATE POLICY ui_tooltips_admin_delete
ON public.ui_tooltips
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.user_profiles up
    WHERE up.id::text = (select auth.uid())::text
      AND up.role = 'admin'
  )
);

-- -----------------------------------------------------------------------------
-- 6) codex_change_logs — admin read
-- -----------------------------------------------------------------------------

DROP POLICY IF EXISTS codex_change_logs_admin_select ON public.codex_change_logs;
CREATE POLICY codex_change_logs_admin_select
  ON public.codex_change_logs
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.user_profiles up
      WHERE up.id::text = (select auth.uid())::text
        AND up.role = 'admin'
    )
  );

-- -----------------------------------------------------------------------------
-- 7) official_enhanced_items — admin write (from security-hardening-2026-06)
-- -----------------------------------------------------------------------------

DROP POLICY IF EXISTS "Admin can insert official enhanced items" ON public.official_enhanced_items;
CREATE POLICY "Admin can insert official enhanced items"
  ON public.official_enhanced_items FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE id = (select auth.uid())::text AND role = 'admin'
  ));

DROP POLICY IF EXISTS "Admin can update official enhanced items" ON public.official_enhanced_items;
CREATE POLICY "Admin can update official enhanced items"
  ON public.official_enhanced_items FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE id = (select auth.uid())::text AND role = 'admin'
  ));

DROP POLICY IF EXISTS "Admin can delete official enhanced items" ON public.official_enhanced_items;
CREATE POLICY "Admin can delete official enhanced items"
  ON public.official_enhanced_items FOR DELETE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE id = (select auth.uid())::text AND role = 'admin'
  ));

-- -----------------------------------------------------------------------------
-- 8) official_* library — admin write policies
-- -----------------------------------------------------------------------------

-- official_powers
DROP POLICY IF EXISTS "Admin can insert official powers" ON public.official_powers;
CREATE POLICY "Admin can insert official powers" ON public.official_powers FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.user_profiles WHERE id = (select auth.uid())::text AND role = 'admin'));
DROP POLICY IF EXISTS "Admin can update official powers" ON public.official_powers;
CREATE POLICY "Admin can update official powers" ON public.official_powers FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.user_profiles WHERE id = (select auth.uid())::text AND role = 'admin'));
DROP POLICY IF EXISTS "Admin can delete official powers" ON public.official_powers;
CREATE POLICY "Admin can delete official powers" ON public.official_powers FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.user_profiles WHERE id = (select auth.uid())::text AND role = 'admin'));

-- official_techniques
DROP POLICY IF EXISTS "Admin can insert official techniques" ON public.official_techniques;
CREATE POLICY "Admin can insert official techniques" ON public.official_techniques FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.user_profiles WHERE id = (select auth.uid())::text AND role = 'admin'));
DROP POLICY IF EXISTS "Admin can update official techniques" ON public.official_techniques;
CREATE POLICY "Admin can update official techniques" ON public.official_techniques FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.user_profiles WHERE id = (select auth.uid())::text AND role = 'admin'));
DROP POLICY IF EXISTS "Admin can delete official techniques" ON public.official_techniques;
CREATE POLICY "Admin can delete official techniques" ON public.official_techniques FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.user_profiles WHERE id = (select auth.uid())::text AND role = 'admin'));

-- official_empowered_techniques
DROP POLICY IF EXISTS "Admin can insert official empowered techniques" ON public.official_empowered_techniques;
CREATE POLICY "Admin can insert official empowered techniques" ON public.official_empowered_techniques FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.user_profiles WHERE id = (select auth.uid())::text AND role = 'admin'));
DROP POLICY IF EXISTS "Admin can update official empowered techniques" ON public.official_empowered_techniques;
CREATE POLICY "Admin can update official empowered techniques" ON public.official_empowered_techniques FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.user_profiles WHERE id = (select auth.uid())::text AND role = 'admin'));
DROP POLICY IF EXISTS "Admin can delete official empowered techniques" ON public.official_empowered_techniques;
CREATE POLICY "Admin can delete official empowered techniques" ON public.official_empowered_techniques FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.user_profiles WHERE id = (select auth.uid())::text AND role = 'admin'));

-- official_items
DROP POLICY IF EXISTS "Admin can insert official items" ON public.official_items;
CREATE POLICY "Admin can insert official items" ON public.official_items FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.user_profiles WHERE id = (select auth.uid())::text AND role = 'admin'));
DROP POLICY IF EXISTS "Admin can update official items" ON public.official_items;
CREATE POLICY "Admin can update official items" ON public.official_items FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.user_profiles WHERE id = (select auth.uid())::text AND role = 'admin'));
DROP POLICY IF EXISTS "Admin can delete official items" ON public.official_items;
CREATE POLICY "Admin can delete official items" ON public.official_items FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.user_profiles WHERE id = (select auth.uid())::text AND role = 'admin'));

-- official_creatures
DROP POLICY IF EXISTS "Admin can insert official creatures" ON public.official_creatures;
CREATE POLICY "Admin can insert official creatures" ON public.official_creatures FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.user_profiles WHERE id = (select auth.uid())::text AND role = 'admin'));
DROP POLICY IF EXISTS "Admin can update official creatures" ON public.official_creatures;
CREATE POLICY "Admin can update official creatures" ON public.official_creatures FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.user_profiles WHERE id = (select auth.uid())::text AND role = 'admin'));
DROP POLICY IF EXISTS "Admin can delete official creatures" ON public.official_creatures;
CREATE POLICY "Admin can delete official creatures" ON public.official_creatures FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.user_profiles WHERE id = (select auth.uid())::text AND role = 'admin'));

-- -----------------------------------------------------------------------------
-- Verification (run after applying):
--   SELECT indexname FROM pg_indexes
--   WHERE schemaname = 'public'
--     AND indexname IN (
--       'idx_role_policies_updated_by',
--       'idx_ui_tooltips_updated_by',
--       'idx_usernames_user_id'
--     );
-- Re-check Supabase Dashboard → Advisors → Performance (initplan + FK indexes).
-- Spot-test: campaign roll insert/delete, admin official-library save, tooltips admin.
-- -----------------------------------------------------------------------------
