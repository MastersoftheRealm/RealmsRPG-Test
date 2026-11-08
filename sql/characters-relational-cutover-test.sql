-- Transactional smoke tests for the ADR-0031 compatibility cutover.
-- Run only after all three cutover SQL files. Every fixture is rolled back.
BEGIN;

DO $tests$
DECLARE
  v_owner_id text;
  v_character_id text := 'relational-cutover-test-character';
  v_create_id text := 'relational-cutover-test-create';
  v_campaign_id text := '20000000-0000-4000-8000-000000000001';
  v_conflict_campaign_id text := '20000000-0000-4000-8000-000000000002';
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
    'namedNotes',jsonb_build_array(jsonb_build_object(
      'id','hidden-note','name','Hidden Note','content','Secret','hidden',false
    )),
    'librarySectionVisibility',jsonb_build_object('shields',false),
    'notesSectionOrder',jsonb_build_array(
      'customNotes','physical','appearance','backstory','archetypeDesc','generalNotes'
    ),
    'notesSectionVisibility',jsonb_build_object('backstory',false),
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
     OR v_document#>>'{equipment,armor,id}' <> 'custom-armor'
     OR v_document#>>'{namedNotes,0,hidden}' <> 'false'
     OR v_document#>>'{librarySectionVisibility,shields}' <> 'false'
     OR v_document#>>'{notesSectionOrder,0}' <> 'customNotes'
     OR v_document#>>'{notesSectionVisibility,backstory}' <> 'false' THEN
    RAISE EXCEPTION 'New scalar, equipment, or preference failed relational round trip';
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

  UPDATE public.characters
  SET last_played_at = '2026-01-02 03:04:05'::timestamp
  WHERE id = v_character_id;
  v_result := public.patch_character_relational(
    v_character_id,
    jsonb_build_object('lastPlayedAt','2030-01-02T03:04:05Z'),
    v_result->>'updatedAt'
  );
  IF v_result->>'status' <> 'updated'
     OR (SELECT last_played_at FROM public.characters WHERE id = v_character_id)
       IS DISTINCT FROM '2026-01-02 03:04:05'::timestamp THEN
    RAISE EXCEPTION 'PATCH allowed client-owned lastPlayedAt mutation';
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

  INSERT INTO public.campaigns (
    id, owner_id, name, description, invite_code, characters,
    owner_username, created_at, updated_at
  ) VALUES (
    v_campaign_id, v_owner_id, 'Relational Campaign Test', '', 'RLTST234', '[]'::jsonb,
    'Relational Test RM', now(), now()
  );
  v_document := public.get_character_relational_document(v_character_id);
  v_result := public.join_campaign_character_relational(
    v_owner_id,
    'RLTST234',
    v_character_id,
    jsonb_build_object('characterName','Relational Smoke Test','level',4),
    v_document->>'updatedAt',
    20,
    10
  );
  IF v_result->>'status' <> 'updated'
     OR NOT EXISTS (
       SELECT 1 FROM public.campaign_members
       WHERE campaign_id = v_campaign_id AND user_id = v_owner_id
     )
     OR NOT EXISTS (
       SELECT 1
       FROM public.campaigns c,
         jsonb_array_elements(c.characters) roster(entry)
       WHERE c.id = v_campaign_id
         AND entry->>'userId' = v_owner_id
         AND entry->>'characterId' = v_character_id
     )
     OR (SELECT visibility FROM public.characters WHERE id = v_character_id) <> 'campaign' THEN
    RAISE EXCEPTION 'Atomic campaign join failed, got %', v_result;
  END IF;

  v_result := public.get_campaign_character_relational_document(
    v_campaign_id, v_owner_id, v_character_id
  );
  IF v_result->>'status' <> 'ok'
     OR v_result#>>'{character,id}' <> v_character_id THEN
    RAISE EXCEPTION 'Atomic campaign character read failed, got %', v_result;
  END IF;

  v_result := public.remove_campaign_character_relational(
    v_owner_id, v_campaign_id, v_owner_id, v_character_id
  );
  IF v_result->>'status' <> 'updated'
     OR (SELECT characters FROM public.campaigns WHERE id = v_campaign_id) <> '[]'::jsonb THEN
    RAISE EXCEPTION 'Atomic campaign character removal failed, got %', v_result;
  END IF;

  v_document := public.get_character_relational_document(v_character_id);
  v_result := public.add_campaign_character_relational(
    v_owner_id,
    v_campaign_id,
    v_character_id,
    jsonb_build_object('characterName','Relational Smoke Test','level',4),
    v_document->>'updatedAt',
    20,
    5
  );
  IF v_result->>'status' <> 'updated' THEN
    RAISE EXCEPTION 'Atomic RM campaign add failed, got %', v_result;
  END IF;
  PERFORM public.remove_campaign_character_relational(
    v_owner_id, v_campaign_id, v_owner_id, v_character_id
  );

  INSERT INTO public.campaigns (
    id, owner_id, name, description, invite_code, characters,
    owner_username, created_at, updated_at
  ) VALUES (
    v_conflict_campaign_id, v_owner_id, 'Relational Conflict Test', '',
    'RLTST235', '[]'::jsonb, 'Relational Test RM', now(), now()
  );
  v_result := public.join_campaign_character_relational(
    v_owner_id,
    'RLTST235',
    v_character_id,
    jsonb_build_object('characterName','Stale Join','level',4),
    v_stale_token,
    20,
    10
  );
  IF v_result->>'status' <> 'conflict'
     OR EXISTS (
       SELECT 1 FROM public.campaign_members
       WHERE campaign_id = v_conflict_campaign_id AND user_id = v_owner_id
     )
     OR (SELECT characters FROM public.campaigns WHERE id = v_conflict_campaign_id)
       <> '[]'::jsonb THEN
    RAISE EXCEPTION 'Conflicted campaign join was not rolled back atomically, got %', v_result;
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
       'public.provision_character_relational(text,text,jsonb)','EXECUTE')
     OR has_function_privilege('authenticated',
       'public.join_campaign_character_relational(text,text,text,jsonb,text,integer,integer)',
       'EXECUTE') THEN
    RAISE EXCEPTION 'Cutover RPC grants are broader than intended';
  END IF;
END;
$tests$;

DO $mirror_parity$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM public.characters c
    WHERE public.get_character_relational_document(c.id) IS DISTINCT FROM c.data
  ) THEN
    RAISE EXCEPTION 'Compatibility mirror parity failed after cutover';
  END IF;
END;
$mirror_parity$;

-- Authenticated callers retain explicit table grants, but RLS has no child
-- write policy. Prove a direct PostgREST-equivalent child insert is rejected.
SELECT set_config(
  'request.jwt.claims',
  jsonb_build_object(
    'sub',(SELECT user_id FROM public.characters ORDER BY id LIMIT 1),
    'role','authenticated'
  )::text,
  true
);
SET LOCAL ROLE authenticated;
DO $direct_child_write$
DECLARE v_character_id text;
BEGIN
  SELECT id INTO v_character_id
  FROM public.characters
  WHERE user_id = auth.uid()::text
  ORDER BY id
  LIMIT 1;
  IF v_character_id IS NULL THEN
    RAISE EXCEPTION 'Direct child write test could not find the owner character';
  END IF;
  BEGIN
    INSERT INTO public.character_affiliations (
      character_id, affiliation_kind, position, name
    ) VALUES (v_character_id, 'ally', 2147483647, 'Direct write must fail');
    RAISE EXCEPTION 'Authenticated direct child write unexpectedly succeeded';
  EXCEPTION WHEN insufficient_privilege THEN
    NULL;
  END;
END;
$direct_child_write$;
RESET ROLE;

ROLLBACK;
