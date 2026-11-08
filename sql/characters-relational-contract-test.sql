-- Transactional smoke test for the ADR-0030 final contract migration.
-- Run only after characters-relational-contract.sql. Fixtures are rolled back.
BEGIN;

DO $tests$
DECLARE
  v_owner_id text;
  v_provision_id text := 'relational-contract-test-provision';
  v_create_id text := 'relational-contract-test-create';
  v_request_id uuid := '30000000-0000-4000-8000-000000000001';
  v_document jsonb;
  v_result jsonb;
  v_token text;
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'characters'
      AND column_name = 'data'
  ) THEN
    RAISE EXCEPTION 'Legacy character column still exists after contract migration';
  END IF;

  SELECT user_id INTO v_owner_id FROM public.characters ORDER BY id LIMIT 1;
  IF v_owner_id IS NULL THEN
    RAISE EXCEPTION 'Contract smoke test requires one existing character owner';
  END IF;

  v_document := jsonb_build_object(
    'name','Contract Provision Test',
    'level',2,
    'visibility','private',
    'innateEnergy',7,
    'trainingPointsSpent',2.5,
    'abilities',jsonb_build_object(
      'strength',1,'vitality',2,'agility',3,
      'acuity',4,'intelligence',5,'charisma',6
    ),
    'feats','[]'::jsonb,
    'skills','[]'::jsonb,
    'powers','[]'::jsonb,
    'techniques','[]'::jsonb,
    'conditions','[]'::jsonb,
    'namedNotes','[]'::jsonb,
    'proficiencies','[]'::jsonb
  );

  v_result := public.provision_character_relational(
    v_provision_id, v_owner_id, v_document
  );
  IF v_result->>'status' <> 'upserted' THEN
    RAISE EXCEPTION 'Provision failed after contract migration: %', v_result;
  END IF;

  v_document := public.get_character_relational_document(v_provision_id);
  IF v_document->>'name' <> 'Contract Provision Test'
     OR v_document->>'innateEnergy' <> '7'
     OR v_document->>'trainingPointsSpent' <> '2.5' THEN
    RAISE EXCEPTION 'Provisioned character failed relational round trip';
  END IF;

  PERFORM set_config(
    'request.jwt.claims',
    jsonb_build_object('sub',v_owner_id,'role','authenticated')::text,
    true
  );
  v_result := public.create_character_relational(
    v_create_id,
    jsonb_build_object('name','Contract Create Test','level',1,'visibility','private'),
    v_request_id
  );
  IF v_result->>'status' <> 'created' OR v_result->>'id' <> v_create_id THEN
    RAISE EXCEPTION 'Create failed after contract migration: %', v_result;
  END IF;

  v_result := public.create_character_relational(
    'relational-contract-test-replay-loser',
    jsonb_build_object('name','Should Replay','level',1,'visibility','private'),
    v_request_id
  );
  IF v_result->>'status' <> 'replayed' OR v_result->>'id' <> v_create_id THEN
    RAISE EXCEPTION 'Idempotent create replay failed after contract migration: %', v_result;
  END IF;

  v_token := public.get_character_relational_document(v_create_id)->>'updatedAt';
  v_result := public.patch_character_relational(
    v_create_id,
    jsonb_build_object('name','Contract Patch Test','lastPlayedAt','2030-01-01T00:00:00Z'),
    v_token
  );
  IF v_result->>'status' <> 'updated' THEN
    RAISE EXCEPTION 'Patch failed after contract migration: %', v_result;
  END IF;

  v_document := public.get_character_relational_document(v_create_id);
  IF v_document->>'name' <> 'Contract Patch Test'
     OR v_document ? 'lastPlayedAt' THEN
    RAISE EXCEPTION 'Patched character failed contract round trip';
  END IF;
END;
$tests$;

ROLLBACK;
