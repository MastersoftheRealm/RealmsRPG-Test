-- 86e3jryyt post-apply verification.
-- Read-only policy checks, then a rolled-back probe:
--   a signed-in owner cannot update or insert a roster entry for someone else
--   the owner can add their own character and can still rename the campaign
--   the service role cannot add a character whose user has not joined
--   after that user joins, the owner can read the campaign-visibility row
--   deleting the membership row, and leaving the JSON in place, removes that read
--   the character owner can still read their own row
-- The probe raises probe_rollback so those rows are not kept.
-- It does not update an existing campaign roster.
-- Fails with RAISE EXCEPTION when an assertion fails.

DO $$
DECLARE
  v_owner text;
  v_other text;
  v_campaign text := 'rls-probe-86e3jryyt-' || gen_random_uuid()::text;
  v_poison text := 'rls-probe-86e3jryyt-ins-' || gen_random_uuid()::text;
  v_owner_char text := 'rls-probe-86e3jryyt-oc-' || gen_random_uuid()::text;
  v_other_char text := 'rls-probe-86e3jryyt-xc-' || gen_random_uuid()::text;
  v_code text := 'p' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 16);
  v_code2 text := 'q' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 16);
  v_n int;
  v_seen int;
  v_check text;
  v_triggerdef text;
  v_orphan_before int;
  v_orphan_after int;
  v_campaigns_before int;
  v_campaigns_after int;
BEGIN
  SELECT count(*) INTO v_n
  FROM pg_trigger
  WHERE tgrelid = 'public.campaigns'::regclass
    AND tgname = 'campaigns_roster_members_only'
    AND NOT tgisinternal;
  IF v_n <> 1 THEN
    RAISE EXCEPTION 'trigger count %', v_n;
  END IF;

  SELECT pg_get_triggerdef(oid) INTO v_triggerdef
  FROM pg_trigger
  WHERE tgname = 'campaigns_roster_members_only'
    AND tgrelid = 'public.campaigns'::regclass
    AND NOT tgisinternal;
  IF position('UPDATE OF characters' IN v_triggerdef) = 0 THEN
    RAISE EXCEPTION 'trigger is not limited to characters';
  END IF;

  SELECT qual INTO v_check
  FROM pg_policies
  WHERE schemaname = 'public'
    AND tablename = 'characters'
    AND policyname = 'characters_select_authenticated';
  IF v_check IS NULL OR position('campaign_roster_user_joined' IN v_check) = 0 THEN
    RAISE EXCEPTION 'select policy missing roster membership predicate';
  END IF;
  IF position('auth_is_campaign_participant' IN v_check) = 0 THEN
    RAISE EXCEPTION 'select policy missing participant predicate';
  END IF;

  SELECT count(*) INTO v_n
  FROM pg_policies
  WHERE schemaname = 'public'
    AND tablename = 'characters'
    AND policyname = 'characters_select_public_anon'
    AND cmd = 'SELECT';
  IF v_n <> 1 THEN
    RAISE EXCEPTION 'anon public select missing';
  END IF;

  SELECT count(*) INTO v_n
  FROM pg_policies
  WHERE schemaname = 'public' AND tablename = 'campaign_members';
  IF v_n <> 3 THEN
    RAISE EXCEPTION 'campaign_members policy count %', v_n;
  END IF;

  SELECT count(*) INTO v_n
  FROM pg_policies
  WHERE schemaname = 'public'
    AND tablename = 'campaign_members'
    AND policyname = 'campaign_members_insert_owner_self'
    AND cmd = 'INSERT';
  IF v_n <> 1 THEN
    RAISE EXCEPTION 'members insert policy changed';
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
    RAISE EXCEPTION 'members insert check changed';
  END IF;

  SELECT count(*) INTO v_n
  FROM pg_policies
  WHERE schemaname = 'public'
    AND tablename = 'campaign_members'
    AND cmd = 'UPDATE';
  IF v_n <> 0 THEN
    RAISE EXCEPTION 'members update policy appeared';
  END IF;

  IF NOT has_function_privilege('authenticated', 'private.campaign_roster_user_joined(text,text)', 'EXECUTE') THEN
    RAISE EXCEPTION 'authenticated cannot execute roster join helper';
  END IF;
  IF has_function_privilege('authenticated', 'private.enforce_campaign_roster_members()', 'EXECUTE') THEN
    RAISE EXCEPTION 'authenticated can execute roster trigger function';
  END IF;

  SELECT count(*) INTO v_orphan_before
  FROM public.campaigns c
  CROSS JOIN LATERAL jsonb_array_elements(c.characters) AS elem(value)
  WHERE NOT EXISTS (
    SELECT 1 FROM public.characters ch
    WHERE ch.id = COALESCE(elem.value->>'characterId', elem.value->>'character_id')
      AND ch.user_id = COALESCE(elem.value->>'userId', elem.value->>'user_id')
  );

  SELECT count(*) INTO v_campaigns_before FROM public.campaigns;

  SELECT id INTO v_owner
  FROM public.user_profiles
  WHERE id ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
  ORDER BY id
  LIMIT 1;
  SELECT id INTO v_other
  FROM public.user_profiles
  WHERE id ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    AND id <> v_owner
  ORDER BY id
  LIMIT 1;
  IF v_owner IS NULL OR v_other IS NULL THEN
    RAISE EXCEPTION 'need two profiles';
  END IF;

  BEGIN
    INSERT INTO public.characters (id, user_id, data, visibility)
    VALUES
      (v_owner_char, v_owner, '{}'::jsonb, 'campaign'),
      (v_other_char, v_other, '{}'::jsonb, 'campaign');

    INSERT INTO public.campaigns (id, owner_id, name, invite_code, characters)
    VALUES (v_campaign, v_owner, 'rls probe', v_code, '[]'::jsonb);

    PERFORM set_config('request.jwt.claim.sub', v_owner, true);
    PERFORM set_config(
      'request.jwt.claims',
      json_build_object('sub', v_owner, 'role', 'authenticated')::text,
      true
    );
    EXECUTE 'SET LOCAL ROLE authenticated';

    BEGIN
      UPDATE public.campaigns
      SET characters = jsonb_build_array(
        jsonb_build_object('userId', v_other, 'characterId', v_other_char)
      )
      WHERE id = v_campaign;
      RAISE EXCEPTION 'REGRESSION owner listed another character';
    EXCEPTION
      WHEN OTHERS THEN
        IF SQLERRM ILIKE '%REGRESSION%' THEN
          RAISE;
        END IF;
        IF SQLERRM NOT ILIKE '%roster can only add your own characters%' THEN
          RAISE EXCEPTION 'owner other-character unexpected %', SQLSTATE;
        END IF;
    END;

    BEGIN
      INSERT INTO public.campaigns (id, owner_id, name, invite_code, characters)
      VALUES (
        v_poison,
        v_owner,
        'rls probe insert',
        v_code2,
        jsonb_build_array(jsonb_build_object('userId', v_other, 'characterId', v_other_char))
      );
      RAISE EXCEPTION 'REGRESSION insert listed another character';
    EXCEPTION
      WHEN OTHERS THEN
        IF SQLERRM ILIKE '%REGRESSION%' THEN
          RAISE;
        END IF;
        IF SQLERRM NOT ILIKE '%roster can only add your own characters%' THEN
          RAISE EXCEPTION 'insert other-character unexpected %', SQLSTATE;
        END IF;
    END;

    UPDATE public.campaigns
    SET characters = jsonb_build_array(
      jsonb_build_object('userId', v_owner, 'characterId', v_owner_char)
    )
    WHERE id = v_campaign;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'own roster update matched no row';
    END IF;

    SELECT count(*) INTO v_seen FROM public.characters WHERE id = v_other_char;
    IF v_seen <> 0 THEN
      RAISE EXCEPTION 'REGRESSION owner read unjoined character';
    END IF;

    SELECT count(*) INTO v_seen FROM public.characters WHERE id = v_owner_char;
    IF v_seen <> 1 THEN
      RAISE EXCEPTION 'owner could not read own character';
    END IF;

    UPDATE public.campaigns SET name = 'rls probe renamed' WHERE id = v_campaign;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'rename matched no row';
    END IF;

    EXECUTE 'RESET ROLE';
    PERFORM set_config('request.jwt.claim.sub', '', true);
    PERFORM set_config('request.jwt.claims', '', true);
    EXECUTE 'SET LOCAL ROLE service_role';

    BEGIN
      UPDATE public.campaigns
      SET characters = characters || jsonb_build_array(
        jsonb_build_object('userId', v_other, 'characterId', v_other_char)
      )
      WHERE id = v_campaign;
      RAISE EXCEPTION 'REGRESSION service role listed non-member';
    EXCEPTION
      WHEN OTHERS THEN
        IF SQLERRM ILIKE '%REGRESSION%' THEN
          RAISE;
        END IF;
        IF SQLERRM NOT ILIKE '%roster user has not joined this campaign%' THEN
          RAISE EXCEPTION 'service non-member unexpected %', SQLSTATE;
        END IF;
    END;

    INSERT INTO public.campaign_members (campaign_id, user_id)
    VALUES (v_campaign, v_other);

    UPDATE public.campaigns
    SET characters = jsonb_build_array(
      jsonb_build_object('userId', v_owner, 'characterId', v_owner_char),
      jsonb_build_object('userId', v_other, 'characterId', v_other_char)
    )
    WHERE id = v_campaign;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'member roster update matched no row';
    END IF;

    EXECUTE 'RESET ROLE';
    PERFORM set_config('request.jwt.claim.sub', v_owner, true);
    PERFORM set_config(
      'request.jwt.claims',
      json_build_object('sub', v_owner, 'role', 'authenticated')::text,
      true
    );
    EXECUTE 'SET LOCAL ROLE authenticated';

    SELECT count(*) INTO v_seen FROM public.characters WHERE id = v_other_char;
    IF v_seen <> 1 THEN
      RAISE EXCEPTION 'joined campaign character not readable';
    END IF;

    EXECUTE 'RESET ROLE';
    PERFORM set_config('request.jwt.claim.sub', '', true);
    PERFORM set_config('request.jwt.claims', '', true);
    EXECUTE 'SET LOCAL ROLE service_role';

    DELETE FROM public.campaign_members
    WHERE campaign_id = v_campaign AND user_id = v_other;

    EXECUTE 'RESET ROLE';
    PERFORM set_config('request.jwt.claim.sub', v_owner, true);
    PERFORM set_config(
      'request.jwt.claims',
      json_build_object('sub', v_owner, 'role', 'authenticated')::text,
      true
    );
    EXECUTE 'SET LOCAL ROLE authenticated';

    SELECT count(*) INTO v_seen FROM public.characters WHERE id = v_other_char;
    IF v_seen <> 0 THEN
      RAISE EXCEPTION 'REGRESSION leftover roster still grants read';
    END IF;

    PERFORM set_config('request.jwt.claim.sub', v_other, true);
    PERFORM set_config(
      'request.jwt.claims',
      json_build_object('sub', v_other, 'role', 'authenticated')::text,
      true
    );

    SELECT count(*) INTO v_seen FROM public.characters WHERE id = v_other_char;
    IF v_seen <> 1 THEN
      RAISE EXCEPTION 'character owner lost their own row';
    END IF;

    RAISE EXCEPTION 'probe_rollback';
  EXCEPTION
    WHEN OTHERS THEN
      IF SQLERRM <> 'probe_rollback' THEN
        RAISE;
      END IF;
  END;

  EXECUTE 'RESET ROLE';

  SELECT count(*) INTO v_n FROM public.campaigns WHERE id IN (v_campaign, v_poison);
  IF v_n <> 0 THEN
    RAISE EXCEPTION 'probe campaign was not rolled back';
  END IF;

  SELECT count(*) INTO v_n FROM public.characters WHERE id IN (v_owner_char, v_other_char);
  IF v_n <> 0 THEN
    RAISE EXCEPTION 'probe characters were not rolled back';
  END IF;

  SELECT count(*) INTO v_campaigns_after FROM public.campaigns;
  IF v_campaigns_after <> v_campaigns_before THEN
    RAISE EXCEPTION 'campaign count changed';
  END IF;

  SELECT count(*) INTO v_orphan_after
  FROM public.campaigns c
  CROSS JOIN LATERAL jsonb_array_elements(c.characters) AS elem(value)
  WHERE NOT EXISTS (
    SELECT 1 FROM public.characters ch
    WHERE ch.id = COALESCE(elem.value->>'characterId', elem.value->>'character_id')
      AND ch.user_id = COALESCE(elem.value->>'userId', elem.value->>'user_id')
  );
  IF v_orphan_after <> v_orphan_before THEN
    RAISE EXCEPTION 'deleted-character roster count changed';
  END IF;
END $$;
