-- 86e3jt562 post-apply verification.
-- Read-only privilege checks, then a rolled-back probe:
--   authenticated cannot update username, photo_url, or last_username_change
--   authenticated can still update display_name
--   authenticated cannot insert a usernames row
--   service_role can update username
--   new_player cannot upload a profile picture; a role with the flag can
-- The probe raises probe_rollback so no profile row is kept changed.

DO $$
DECLARE
  v_uid text;
  v_new_player text;
  v_uploader text;
  v_display text;
  v_username text;
  v_display_after text;
  v_username_after text;
  v_n int;
  v_can boolean;
  v_check text;
BEGIN
  SELECT count(*) INTO v_n
  FROM information_schema.column_privileges
  WHERE table_schema = 'public'
    AND table_name = 'user_profiles'
    AND grantee = 'authenticated'
    AND privilege_type = 'UPDATE'
    AND column_name IN (
      'username', 'username_display', 'photo_url', 'last_username_change', 'email', 'role', 'created_at', 'id'
    );
  IF v_n <> 0 THEN
    RAISE EXCEPTION 'authenticated still has UPDATE on % protected columns', v_n;
  END IF;

  SELECT count(*) INTO v_n
  FROM information_schema.column_privileges
  WHERE table_schema = 'public'
    AND table_name = 'user_profiles'
    AND grantee = 'authenticated'
    AND privilege_type = 'UPDATE'
    AND column_name IN ('display_name', 'updated_at');
  IF v_n <> 2 THEN
    RAISE EXCEPTION 'display_name/updated_at UPDATE grants = %', v_n;
  END IF;

  SELECT count(*) INTO v_n
  FROM information_schema.column_privileges
  WHERE table_schema = 'public'
    AND table_name = 'usernames'
    AND grantee = 'authenticated'
    AND privilege_type IN ('INSERT', 'UPDATE');
  IF v_n <> 0 THEN
    RAISE EXCEPTION 'authenticated still has usernames write column grants';
  END IF;

  SELECT count(*) INTO v_n
  FROM information_schema.table_privileges
  WHERE table_schema = 'public'
    AND table_name = 'usernames'
    AND grantee = 'authenticated'
    AND privilege_type IN ('INSERT', 'UPDATE', 'DELETE');
  IF v_n <> 0 THEN
    RAISE EXCEPTION 'authenticated still has usernames write table grants';
  END IF;

  SELECT count(*) INTO v_n
  FROM pg_policies
  WHERE schemaname = 'public'
    AND tablename = 'usernames'
    AND cmd IN ('INSERT', 'UPDATE', 'DELETE');
  IF v_n <> 0 THEN
    RAISE EXCEPTION 'usernames write policies still present';
  END IF;

  SELECT with_check INTO v_check
  FROM pg_policies
  WHERE schemaname = 'storage'
    AND tablename = 'objects'
    AND policyname = 'Users can upload own profile picture';
  IF v_check IS NULL OR position('auth_can_upload_profile_picture' IN v_check) = 0 THEN
    RAISE EXCEPTION 'profile picture insert policy missing role check';
  END IF;

  SELECT id, display_name, username
    INTO v_uid, v_display, v_username
  FROM public.user_profiles
  WHERE username IS NOT NULL
  LIMIT 1;
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'no profile to probe';
  END IF;

  SELECT id INTO v_new_player
  FROM public.user_profiles
  WHERE role = 'new_player'
  LIMIT 1;

  SELECT id INTO v_uploader
  FROM public.user_profiles up
  JOIN public.role_policies rp ON rp.role = up.role
  WHERE coalesce((rp.permissions ->> 'can_upload_profile_picture')::boolean, false)
  LIMIT 1;

  BEGIN
    PERFORM set_config('request.jwt.claim.sub', v_uid, true);
    PERFORM set_config(
      'request.jwt.claims',
      json_build_object('sub', v_uid, 'role', 'authenticated')::text,
      true
    );
    EXECUTE 'SET LOCAL ROLE authenticated';

    BEGIN
      UPDATE public.user_profiles
      SET username = username || 'x'
      WHERE id = v_uid;
      RAISE EXCEPTION 'REGRESSION username update';
    EXCEPTION
      WHEN OTHERS THEN
        IF SQLERRM ILIKE '%REGRESSION%' THEN
          RAISE;
        END IF;
        IF SQLERRM NOT ILIKE '%permission denied%'
           AND SQLERRM NOT ILIKE '%Profile fields must be set by the server%' THEN
          RAISE EXCEPTION 'username update unexpected: %', SQLERRM;
        END IF;
    END;

    BEGIN
      UPDATE public.user_profiles
      SET photo_url = 'https://example.invalid/not-a-photo'
      WHERE id = v_uid;
      RAISE EXCEPTION 'REGRESSION photo_url update';
    EXCEPTION
      WHEN OTHERS THEN
        IF SQLERRM ILIKE '%REGRESSION%' THEN
          RAISE;
        END IF;
        IF SQLERRM NOT ILIKE '%permission denied%'
           AND SQLERRM NOT ILIKE '%Profile fields must be set by the server%' THEN
          RAISE EXCEPTION 'photo_url update unexpected: %', SQLERRM;
        END IF;
    END;

    BEGIN
      UPDATE public.user_profiles
      SET last_username_change = now()
      WHERE id = v_uid;
      RAISE EXCEPTION 'REGRESSION cooldown update';
    EXCEPTION
      WHEN OTHERS THEN
        IF SQLERRM ILIKE '%REGRESSION%' THEN
          RAISE;
        END IF;
        IF SQLERRM NOT ILIKE '%permission denied%'
           AND SQLERRM NOT ILIKE '%Profile fields must be set by the server%' THEN
          RAISE EXCEPTION 'cooldown update unexpected: %', SQLERRM;
        END IF;
    END;

    BEGIN
      INSERT INTO public.usernames (username, user_id)
      VALUES ('probe86e3jt562', v_uid);
      RAISE EXCEPTION 'REGRESSION usernames insert';
    EXCEPTION
      WHEN OTHERS THEN
        IF SQLERRM ILIKE '%REGRESSION%' THEN
          RAISE;
        END IF;
        IF SQLERRM NOT ILIKE '%permission denied%'
           AND SQLERRM NOT ILIKE '%row-level security%' THEN
          RAISE EXCEPTION 'usernames insert unexpected: %', SQLERRM;
        END IF;
    END;

    UPDATE public.user_profiles
    SET display_name = coalesce(display_name, '') || ' probe86e3jt562'
    WHERE id = v_uid;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'display_name update did not match the caller';
    END IF;

    IF v_new_player IS NOT NULL THEN
      PERFORM set_config('request.jwt.claim.sub', v_new_player, true);
      PERFORM set_config(
        'request.jwt.claims',
        json_build_object('sub', v_new_player, 'role', 'authenticated')::text,
        true
      );
      SELECT public.auth_can_upload_profile_picture() INTO v_can;
      IF v_can THEN
        RAISE EXCEPTION 'REGRESSION new_player can upload a profile picture';
      END IF;
    END IF;

    IF v_uploader IS NOT NULL THEN
      PERFORM set_config('request.jwt.claim.sub', v_uploader, true);
      PERFORM set_config(
        'request.jwt.claims',
        json_build_object('sub', v_uploader, 'role', 'authenticated')::text,
        true
      );
      SELECT public.auth_can_upload_profile_picture() INTO v_can;
      IF NOT v_can THEN
        RAISE EXCEPTION 'uploader role lost profile picture permission';
      END IF;
    END IF;

    EXECUTE 'RESET ROLE';
    -- auth.role() reads the JWT claim, not the Postgres role.
    PERFORM set_config('request.jwt.claim.role', 'service_role', true);
    PERFORM set_config(
      'request.jwt.claims',
      json_build_object('sub', v_uid, 'role', 'service_role')::text,
      true
    );
    EXECUTE 'SET LOCAL ROLE service_role';

    UPDATE public.user_profiles
    SET username = username || 'svc86e3jt562'
    WHERE id = v_uid;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'service role username update did not match';
    END IF;

    RAISE EXCEPTION 'probe_rollback';
  EXCEPTION
    WHEN OTHERS THEN
      IF SQLERRM <> 'probe_rollback' THEN
        RAISE;
      END IF;
  END;

  EXECUTE 'RESET ROLE';

  SELECT display_name, username INTO v_display_after, v_username_after
  FROM public.user_profiles
  WHERE id = v_uid;
  IF v_display_after IS DISTINCT FROM v_display
     OR v_username_after IS DISTINCT FROM v_username THEN
    RAISE EXCEPTION 'probe changes were not rolled back';
  END IF;
END $$;
