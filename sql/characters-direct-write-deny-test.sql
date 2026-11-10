-- Transactional smoke test for characters-direct-write-deny.sql.
-- Run only after that migration. Fixtures are rolled back.
BEGIN;

DO $policy_state$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'characters'
      AND policyname = 'Users can insert own characters'
  ) THEN
    RAISE EXCEPTION 'Owner INSERT policy still present after direct-write deny migration';
  END IF;
  IF EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'characters'
      AND policyname = 'Users can update own characters'
  ) THEN
    RAISE EXCEPTION 'Owner UPDATE policy still present after direct-write deny migration';
  END IF;
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'characters'
      AND policyname = 'Users can delete own characters'
  ) THEN
    RAISE EXCEPTION 'Owner DELETE policy missing after direct-write deny migration';
  END IF;
END;
$policy_state$;

SELECT set_config(
  'request.jwt.claims',
  jsonb_build_object(
    'sub',(SELECT user_id FROM public.characters ORDER BY id LIMIT 1),
    'role','authenticated'
  )::text,
  true
);
SET LOCAL ROLE authenticated;

DO $direct_parent_write$
DECLARE
  v_owner_id text;
  v_character_id text;
  v_before_name text;
  v_after_name text;
BEGIN
  v_owner_id := auth.uid()::text;
  IF v_owner_id IS NULL THEN
    RAISE EXCEPTION 'Direct parent write test requires an authenticated subject';
  END IF;

  SELECT id, name INTO v_character_id, v_before_name
  FROM public.characters
  WHERE user_id = v_owner_id
  ORDER BY id
  LIMIT 1;
  IF v_character_id IS NULL THEN
    RAISE EXCEPTION 'Direct parent write test could not find an owner character';
  END IF;

  BEGIN
    INSERT INTO public.characters (
      id, user_id, data, name, level, visibility
    ) VALUES (
      'characters-direct-write-deny-insert',
      v_owner_id,
      '{}'::jsonb,
      'Direct insert must fail',
      1,
      'private'
    );
    RAISE EXCEPTION 'Authenticated direct parent insert unexpectedly succeeded';
  EXCEPTION
    WHEN insufficient_privilege THEN
      NULL;
  END;

  UPDATE public.characters
  SET name = coalesce(v_before_name, '') || ' direct-update-must-fail'
  WHERE id = v_character_id AND user_id = v_owner_id;

  SELECT name INTO v_after_name
  FROM public.characters
  WHERE id = v_character_id;

  IF v_after_name IS DISTINCT FROM v_before_name THEN
    RAISE EXCEPTION 'Authenticated direct parent update unexpectedly changed the row';
  END IF;
END;
$direct_parent_write$;

RESET ROLE;

ROLLBACK;
