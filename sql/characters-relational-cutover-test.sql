-- Transactional smoke tests for the ADR-0030 compatibility cutover.
-- Run only after all three cutover SQL files. Every fixture is rolled back.
BEGIN;

DO $tests$
DECLARE
  v_owner_id text;
  v_character_id text := 'relational-cutover-test-character';
  v_create_id text := 'relational-cutover-test-create';
  v_request_id uuid := '10000000-0000-4000-8000-000000000001';
  v_document jsonb;
  v_result jsonb;
  v_token text;
  v_stale_token text;
  v_before timestamp without time zone;
BEGIN
  SELECT user_id INTO v_owner_id FROM public.characters ORDER BY id LIMIT 1;
  IF v_owner_id IS NULL THEN
    RAISE EXCEPTION 'Cutover smoke test requires one existing character owner';
  END IF;

  v_document := jsonb_build_object(
    'name','Relational Smoke Test',
    'level',2,
    'visibility','private',
    'innateEnergy',7,
    'trainingPointsSpent',2.5,
    'abilities',jsonb_build_object(
      'strength',1,'vitality',2,'agility',3,
      'acuity',4,'intelligence',5,'charisma',6
    ),
    'equipment',jsonb_build_object(
      'mainHand',jsonb_build_object('id','custom-main','name','Test Blade'),
      'offHand',jsonb_build_object('id','custom-off','name','Test Shield','type','shield'),
      'weapons','[]'::jsonb,'shields','[]'::jsonb,
      'armor',jsonb_build_object('id','custom-armor','name','Test Armor','type','armor'),
      'items','[]'::jsonb,'accessories','[]'::jsonb
    ),
    'feats','[]'::jsonb,
    'skills','[]'::jsonb,
    'powers','[]'::jsonb,
    'techniques','[]'::jsonb,
    'conditions','[]'::jsonb,
    'namedNotes','[]'::jsonb,
    'proficiencies','[]'::jsonb
  );

  PERFORM public.provision_character_relational(
    v_character_id, v_owner_id, v_document
  );
  v_document := public.get_character_relational_document(v_character_id);

  IF v_document IS DISTINCT FROM (
    SELECT data FROM public.characters WHERE id = v_character_id
  ) THEN
    RAISE EXCEPTION 'Provision compatibility mirror differs from relational document';
  END IF;

  IF v_document->>'innateEnergy' <> '7'
     OR v_document->>'trainingPointsSpent' <> '2.5'
     OR v_document#>>'{equipment,mainHand,id}' <> 'custom-main'
     OR v_document#>>'{equipment,offHand,id}' <> 'custom-off'
     OR v_document#>>'{equipment,armor,id}' <> 'custom-armor' THEN
    RAISE EXCEPTION 'New scalar or equipment slot failed relational round trip';
  END IF;

  PERFORM set_config(
    'request.jwt.claims',
    jsonb_build_object('sub',v_owner_id,'role','authenticated')::text,
    true
  );
  v_token := v_document->>'updatedAt';
  v_result := public.patch_character_relational(
    v_character_id,
    jsonb_build_object(
      'name','Patched Smoke Test',
      'notes',null,
      'equipment',jsonb_build_object(
        'weapons','[]'::jsonb,'shields','[]'::jsonb,'armor','[]'::jsonb,
        'items','[]'::jsonb,'accessories','[]'::jsonb
      )
    ),
    v_token
  );
  IF v_result->>'status' <> 'updated' THEN
    RAISE EXCEPTION 'Expected updated patch outcome, got %', v_result;
  END IF;

  v_stale_token := v_token;
  v_token := v_result->>'updatedAt';
  IF (v_token::timestamptz AT TIME ZONE 'UTC') IS DISTINCT FROM (
    SELECT updated_at FROM public.characters WHERE id = v_character_id
  ) THEN
    RAISE EXCEPTION 'PATCH returned a lock token that differs from the stored timestamp';
  END IF;

  v_result := public.patch_character_relational(
    v_character_id, jsonb_build_object('level',3), v_token
  );
  IF v_result->>'status' <> 'updated' THEN
    RAISE EXCEPTION 'Expected chained PATCH to accept the prior response token, got %', v_result;
  END IF;

  v_document := public.get_character_relational_document(v_character_id);
  IF v_document->>'name' <> 'Patched Smoke Test'
     OR v_document->>'level' <> '3'
     OR v_document ? 'notes'
     OR v_document#>'{equipment,weapons}' <> '[]'::jsonb
     OR EXISTS (
       SELECT 1 FROM public.character_inventory WHERE character_id = v_character_id
     ) THEN
    RAISE EXCEPTION 'Dirty patch null/empty/omitted semantics failed';
  END IF;
  IF v_document IS DISTINCT FROM (
    SELECT data FROM public.characters WHERE id = v_character_id
  ) THEN
    RAISE EXCEPTION 'Compatibility mirror differs from relational document at keys %',
      (SELECT array_agg(key ORDER BY key)
       FROM (
         SELECT key FROM jsonb_object_keys(
           v_document || (SELECT data FROM public.characters WHERE id = v_character_id)
         ) key
         WHERE v_document->key IS DISTINCT FROM
           (SELECT data->key FROM public.characters WHERE id = v_character_id)
       ) differing);
  END IF;

  v_result := public.patch_character_relational(
    v_character_id, jsonb_build_object('level',4), v_stale_token
  );
  IF v_result->>'status' <> 'conflict' THEN
    RAISE EXCEPTION 'Expected optimistic-lock conflict, got %', v_result;
  END IF;

  SELECT updated_at INTO v_before FROM public.characters WHERE id = v_character_id;
  BEGIN
    PERFORM public.patch_character_relational(
      v_character_id, jsonb_build_object('unmappedSmokeField',true), NULL
    );
    RAISE EXCEPTION 'Unknown document key should have failed';
  EXCEPTION WHEN SQLSTATE '22023' THEN
    NULL;
  END;
  IF (SELECT updated_at FROM public.characters WHERE id = v_character_id)
     IS DISTINCT FROM v_before THEN
    RAISE EXCEPTION 'Failed patch was not rolled back atomically';
  END IF;

  v_result := public.create_character_relational(
    v_create_id, jsonb_build_object('name','Idempotent Test','level',1), v_request_id
  );
  IF v_result->>'status' <> 'created' THEN
    RAISE EXCEPTION 'Expected created outcome, got %', v_result;
  END IF;
  v_document := public.get_character_relational_document(v_create_id);
  IF v_document IS DISTINCT FROM (
    SELECT data FROM public.characters WHERE id = v_create_id
  ) THEN
    RAISE EXCEPTION 'Create compatibility mirror differs from relational document';
  END IF;
  v_result := public.create_character_relational(
    'relational-cutover-test-create-retry',
    jsonb_build_object('name','Idempotent Retry','level',1),
    v_request_id
  );
  IF v_result->>'status' <> 'replayed' OR v_result->>'id' <> v_create_id THEN
    RAISE EXCEPTION 'Idempotent replay failed, got %', v_result;
  END IF;

  PERFORM set_config(
    'request.jwt.claims',
    jsonb_build_object('sub','00000000-0000-4000-8000-000000000099',
                       'role','authenticated')::text,
    true
  );
  v_result := public.patch_character_relational(
    v_character_id, jsonb_build_object('name','Unauthorized'), NULL
  );
  IF v_result->>'status' <> 'not_found' THEN
    RAISE EXCEPTION 'Cross-owner patch was not hidden';
  END IF;

  IF has_function_privilege('anon',
       'public.patch_character_relational(text,jsonb,text)','EXECUTE')
     OR has_function_privilege('authenticated',
       'public.provision_character_relational(text,text,jsonb)','EXECUTE') THEN
    RAISE EXCEPTION 'Cutover RPC grants are broader than intended (anon patch %, authenticated provision %)',
      has_function_privilege('anon',
        'public.patch_character_relational(text,jsonb,text)','EXECUTE'),
      has_function_privilege('authenticated',
        'public.provision_character_relational(text,text,jsonb)','EXECUTE');
  END IF;
END;
$tests$;

ROLLBACK;
