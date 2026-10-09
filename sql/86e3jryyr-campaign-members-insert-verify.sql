-- 86e3jryyr post-apply verification.
-- Read-only policy checks, then a rolled-back probe:
--   a non-owner cannot insert their own campaign_members row
--   an owner cannot insert a different user_id
--   the owner can insert their own row
--   UPDATE changes 0 rows (no update policy)
--   service_role can insert the invited member
-- The probe raises probe_rollback so those rows are not kept.
-- Fails with RAISE EXCEPTION when an assertion fails.

DO $$
DECLARE
  v_owner text;
  v_other text;
  v_other_campaign text;
  v_campaign text := 'rls-probe-86e3jryyr-' || gen_random_uuid()::text;
  v_check text;
  v_n int;
  v_updated int;
  v_still int;
BEGIN
  SELECT count(*) INTO v_n
  FROM pg_policies
  WHERE schemaname = 'public'
    AND tablename = 'campaign_members'
    AND policyname = 'campaign_members_insert_owner_self'
    AND cmd = 'INSERT';
  IF v_n <> 1 THEN
    RAISE EXCEPTION 'insert policy count %', v_n;
  END IF;

  SELECT with_check INTO v_check
  FROM pg_policies
  WHERE schemaname = 'public'
    AND tablename = 'campaign_members'
    AND policyname = 'campaign_members_insert_owner_self';
  IF v_check IS NULL
     OR position('auth_is_campaign_owner' IN v_check) = 0
     OR position('user_id' IN v_check) = 0
     OR position(' OR ' IN v_check) > 0 THEN
    RAISE EXCEPTION 'unexpected insert check';
  END IF;

  SELECT count(*) INTO v_n
  FROM pg_policies
  WHERE schemaname = 'public'
    AND tablename = 'campaign_members'
    AND policyname = 'campaign_members_insert_owner_or_self';
  IF v_n <> 0 THEN
    RAISE EXCEPTION 'old insert policy still present';
  END IF;

  SELECT count(*) INTO v_n
  FROM pg_policies
  WHERE schemaname = 'public'
    AND tablename = 'campaign_members'
    AND cmd = 'UPDATE';
  IF v_n <> 0 THEN
    RAISE EXCEPTION 'update policy still present';
  END IF;

  SELECT count(*) INTO v_n
  FROM pg_policies
  WHERE schemaname = 'public'
    AND tablename = 'campaign_members'
    AND policyname = 'campaign_members_select_participants'
    AND cmd = 'SELECT';
  IF v_n <> 1 THEN
    RAISE EXCEPTION 'select policy count %', v_n;
  END IF;

  SELECT count(*) INTO v_n
  FROM pg_policies
  WHERE schemaname = 'public'
    AND tablename = 'campaign_members'
    AND policyname = 'campaign_members_delete_owner_or_self'
    AND cmd = 'DELETE';
  IF v_n <> 1 THEN
    RAISE EXCEPTION 'delete policy count %', v_n;
  END IF;

  SELECT c.owner_id INTO v_owner
  FROM public.campaigns c
  JOIN public.user_profiles p ON p.id = c.owner_id
  LIMIT 1;
  IF v_owner IS NULL THEN
    RAISE EXCEPTION 'no owner to probe';
  END IF;

  SELECT p.id INTO v_other
  FROM public.user_profiles p
  WHERE p.id <> v_owner
  LIMIT 1;
  IF v_other IS NULL THEN
    RAISE EXCEPTION 'no second user to probe';
  END IF;

  SELECT c.id INTO v_other_campaign
  FROM public.campaigns c
  WHERE c.owner_id <> v_owner
  LIMIT 1;

  BEGIN
    INSERT INTO public.campaigns (id, owner_id, name, invite_code, characters)
    VALUES (v_campaign, v_owner, 'rls probe', 'PROBE86E3', '[]'::jsonb);

    PERFORM set_config('request.jwt.claim.sub', v_other, true);
    PERFORM set_config(
      'request.jwt.claims',
      json_build_object('sub', v_other, 'role', 'authenticated')::text,
      true
    );
    EXECUTE 'SET LOCAL ROLE authenticated';

    BEGIN
      INSERT INTO public.campaign_members (campaign_id, user_id)
      VALUES (v_campaign, v_other);
      RAISE EXCEPTION 'REGRESSION non-owner self-insert';
    EXCEPTION
      WHEN OTHERS THEN
        IF SQLERRM ILIKE '%REGRESSION%' THEN
          RAISE;
        END IF;
        IF SQLERRM NOT ILIKE '%row-level security%' THEN
          RAISE EXCEPTION 'non-owner insert unexpected';
        END IF;
    END;

    PERFORM set_config('request.jwt.claim.sub', v_owner, true);
    PERFORM set_config(
      'request.jwt.claims',
      json_build_object('sub', v_owner, 'role', 'authenticated')::text,
      true
    );

    BEGIN
      INSERT INTO public.campaign_members (campaign_id, user_id)
      VALUES (v_campaign, v_other);
      RAISE EXCEPTION 'REGRESSION owner inserted other user';
    EXCEPTION
      WHEN OTHERS THEN
        IF SQLERRM ILIKE '%REGRESSION%' THEN
          RAISE;
        END IF;
        IF SQLERRM NOT ILIKE '%row-level security%' THEN
          RAISE EXCEPTION 'owner-other insert unexpected';
        END IF;
    END;

    INSERT INTO public.campaign_members (campaign_id, user_id)
    VALUES (v_campaign, v_owner);

    IF v_other_campaign IS NOT NULL THEN
      UPDATE public.campaign_members
      SET campaign_id = v_other_campaign
      WHERE campaign_id = v_campaign AND user_id = v_owner;
      GET DIAGNOSTICS v_updated = ROW_COUNT;
      IF v_updated <> 0 THEN
        RAISE EXCEPTION 'REGRESSION update moved % rows', v_updated;
      END IF;
    END IF;

    EXECUTE 'RESET ROLE';

    SELECT count(*) INTO v_still
    FROM public.campaign_members
    WHERE campaign_id = v_campaign AND user_id = v_owner;
    IF v_still <> 1 THEN
      RAISE EXCEPTION 'owner self-insert missing after update attempt';
    END IF;

    EXECUTE 'SET LOCAL ROLE service_role';
    INSERT INTO public.campaign_members (campaign_id, user_id)
    VALUES (v_campaign, v_other);

    EXECUTE 'RESET ROLE';
    SELECT count(*) INTO v_still
    FROM public.campaign_members
    WHERE campaign_id = v_campaign AND user_id = v_other;
    IF v_still <> 1 THEN
      RAISE EXCEPTION 'service role insert missing';
    END IF;

    RAISE EXCEPTION 'probe_rollback';
  EXCEPTION
    WHEN OTHERS THEN
      IF SQLERRM <> 'probe_rollback' THEN
        RAISE;
      END IF;
  END;

  EXECUTE 'RESET ROLE';

  SELECT count(*) INTO v_still
  FROM public.campaigns
  WHERE id = v_campaign;
  IF v_still <> 0 THEN
    RAISE EXCEPTION 'probe campaign was not rolled back';
  END IF;
END $$;
