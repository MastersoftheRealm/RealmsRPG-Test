-- TASK-650 post-apply verification (advisor-parity + RLS access smoke)
-- Run: node scripts/verify-task-650.mjs
-- Fails with RAISE EXCEPTION when any assertion fails (psql ON_ERROR_STOP=1).

\echo '=== campaigns policies (expect 4 rows) ==='
SELECT policyname, cmd, roles::text
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'campaigns'
ORDER BY cmd, policyname;

-- -----------------------------------------------------------------------------
-- Advisor parity: multiple_permissive_policies (same table, role, cmd)
-- Mirrors Supabase performance advisor D6 / get_advisors check.
-- -----------------------------------------------------------------------------
DO $$
DECLARE
  dup_count int;
BEGIN
  SELECT count(*) INTO dup_count
  FROM (
    SELECT cmd, roles::text
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'campaigns'
      AND permissive = 'PERMISSIVE'
    GROUP BY cmd, roles::text
    HAVING count(*) > 1
  ) d;

  IF dup_count > 0 THEN
    RAISE EXCEPTION 'multiple_permissive_policies: % duplicate (cmd, roles) groups on campaigns', dup_count;
  END IF;
END $$;

DO $$
DECLARE
  n int;
BEGIN
  SELECT count(*) INTO n
  FROM pg_policies
  WHERE schemaname = 'public'
    AND tablename = 'campaigns'
    AND permissive = 'PERMISSIVE'
    AND cmd IN ('SELECT', 'ALL')
    AND 'authenticated' = ANY(roles);

  IF n <> 1 THEN
    RAISE EXCEPTION 'expected 1 authenticated SELECT policy on campaigns, got %', n;
  END IF;

  SELECT count(*) INTO n
  FROM pg_policies
  WHERE schemaname = 'public'
    AND tablename = 'campaigns'
    AND policyname = 'campaigns_owner_select';

  IF n <> 0 THEN
    RAISE EXCEPTION 'campaigns_owner_select should be dropped, found %', n;
  END IF;

  SELECT count(*) INTO n
  FROM pg_policies
  WHERE schemaname = 'public'
    AND tablename = 'campaigns'
    AND policyname = 'campaigns_select_participants'
    AND cmd = 'SELECT';

  IF n <> 1 THEN
    RAISE EXCEPTION 'campaigns_select_participants missing or duplicated (count=%)', n;
  END IF;

  IF (SELECT count(*) FROM pg_policies WHERE schemaname = 'public' AND tablename = 'campaigns') <> 4 THEN
    RAISE EXCEPTION 'expected 4 total campaigns policies, got %',
      (SELECT count(*) FROM pg_policies WHERE schemaname = 'public' AND tablename = 'campaigns');
  END IF;
END $$;

-- -----------------------------------------------------------------------------
-- RLS access smoke: owner, member, non-participant (JWT claim simulation)
-- Uses first campaign with a non-owner member when available.
-- -----------------------------------------------------------------------------
DO $$
DECLARE
  v_campaign_id text;
  v_owner_id text;
  v_member_id text;
  v_stranger_id text;
  v_visible int;
BEGIN
  SELECT c.id, c.owner_id, m.user_id
  INTO v_campaign_id, v_owner_id, v_member_id
  FROM public.campaigns c
  JOIN public.campaign_members m
    ON m.campaign_id = c.id AND m.user_id <> c.owner_id
  LIMIT 1;

  IF v_campaign_id IS NULL THEN
    RAISE NOTICE 'SKIP RLS smoke: no campaign with non-owner member';
    RETURN;
  END IF;

  SELECT up.id INTO v_stranger_id
  FROM public.user_profiles up
  WHERE up.id <> v_owner_id
    AND up.id <> v_member_id
    AND NOT EXISTS (
      SELECT 1 FROM public.campaign_members cm
      WHERE cm.campaign_id = v_campaign_id AND cm.user_id = up.id
    )
  LIMIT 1;

  IF v_stranger_id IS NULL THEN
    RAISE EXCEPTION 'RLS smoke: could not find stranger user for campaign %', v_campaign_id;
  END IF;

  -- Owner can SELECT
  PERFORM set_config('role', 'authenticated', true);
  PERFORM set_config('request.jwt.claim.sub', v_owner_id, true);
  SELECT count(*) INTO v_visible FROM public.campaigns WHERE id = v_campaign_id;
  IF v_visible <> 1 THEN
    RAISE EXCEPTION 'owner RLS: expected 1 row, got %', v_visible;
  END IF;

  -- Member can SELECT
  PERFORM set_config('request.jwt.claim.sub', v_member_id, true);
  SELECT count(*) INTO v_visible FROM public.campaigns WHERE id = v_campaign_id;
  IF v_visible <> 1 THEN
    RAISE EXCEPTION 'member RLS: expected 1 row, got %', v_visible;
  END IF;

  -- Non-participant cannot SELECT
  PERFORM set_config('request.jwt.claim.sub', v_stranger_id, true);
  SELECT count(*) INTO v_visible FROM public.campaigns WHERE id = v_campaign_id;
  IF v_visible <> 0 THEN
    RAISE EXCEPTION 'stranger RLS: expected 0 rows, got %', v_visible;
  END IF;

  PERFORM set_config('role', 'postgres', true);
END $$;

\echo '=== TASK-650 verify PASS ==='
