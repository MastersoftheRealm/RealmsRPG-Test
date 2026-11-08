-- ADR-0030 compatibility cutover, phase 3 of 3.
-- Apply after characters-relational-cutover.sql and
-- characters-relational-read-rpc.sql. The public HTTP contract remains JSON;
-- these RPCs make relational rows authoritative and keep data as a mirror.
BEGIN;

CREATE OR REPLACE FUNCTION public.apply_character_relational_document(
  p_character_id text,
  p_document jsonb,
  p_updated_at timestamp without time zone
)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER
SET search_path = pg_catalog, public AS $fn$
DECLARE
  v_row public.characters%ROWTYPE;
  v_document jsonb;
  v_archetype_name text;
  v_previous_compat text;
  v_previous_relational text;
BEGIN
  -- characters.updated_at is timestamp(3); normalize before mirroring so the
  -- lock token is byte-for-byte identical in the row and compatibility JSON.
  p_updated_at := p_updated_at::timestamp(3);
  SELECT * INTO STRICT v_row FROM public.characters WHERE id = p_character_id;
  PERFORM public.assert_character_document_mapped(p_document);

  SELECT a.name INTO v_archetype_name
  FROM public.codex_archetypes a
  WHERE a.id = coalesce(
    nullif(p_document->>'archetypePathId',''),
    nullif(p_document#>>'{archetype,id}','')
  );
  v_archetype_name := coalesce(
    v_archetype_name,
    nullif(p_document#>>'{archetype,name}',''),
    initcap(replace(nullif(p_document#>>'{archetype,type}',''), '-', ' '))
  );

  v_document := p_document || jsonb_build_object(
    'id', v_row.id,
    'userId', v_row.user_id,
    'createdAt', coalesce(p_document->'createdAt', to_jsonb(v_row.created_at)),
    'updatedAt', to_jsonb(p_updated_at)
  );

  v_previous_compat := current_setting('app.character_compat_sync', true);
  v_previous_relational := current_setting('app.character_relational_write', true);
  PERFORM set_config('app.character_compat_sync','on',true);
  PERFORM set_config('app.character_relational_write','on',true);

  PERFORM public.sync_character_scalar_columns(p_character_id, v_document);
  PERFORM public.sync_character_cutover_scalars(p_character_id, v_document);
  PERFORM public.sync_character_child_tables(p_character_id, v_document);

  UPDATE public.characters SET
    updated_at = p_updated_at,
    name = coalesce(nullif(v_document->>'name',''), 'Unnamed'),
    level = coalesce(nullif(v_document->>'level','')::integer, 1),
    archetype_name = v_archetype_name,
    ancestry_name = coalesce(
      nullif(v_document#>>'{ancestry,name}',''),
      nullif(v_document->>'species','')
    ),
    status = nullif(v_document->>'status',''),
    visibility = coalesce(nullif(v_document->>'visibility',''), 'private')
  WHERE id = p_character_id;

  -- Rebuild the rollback mirror from the rows that were actually persisted.
  -- The projector can normalize aliases/defaults and deduplicate collections,
  -- so retaining the incoming document would immediately allow data to drift.
  v_document := public.get_character_relational_document(p_character_id);
  IF v_document IS NULL THEN
    RAISE EXCEPTION 'Character % not found after relational projection', p_character_id
      USING ERRCODE = 'P0002';
  END IF;
  UPDATE public.characters SET data = v_document WHERE id = p_character_id;

  PERFORM set_config('app.character_compat_sync',coalesce(v_previous_compat,''),true);
  PERFORM set_config('app.character_relational_write',coalesce(v_previous_relational,''),true);
  RETURN v_document;
END;
$fn$;

REVOKE ALL ON FUNCTION public.apply_character_relational_document(
  text,jsonb,timestamp without time zone
) FROM PUBLIC, anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION public.create_character_relational(
  p_character_id text,
  p_document jsonb,
  p_client_request_id uuid DEFAULT NULL
)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER
SET search_path = pg_catalog, public, auth AS $fn$
DECLARE
  v_owner_id text := auth.uid()::text;
  v_existing_id text;
  v_now timestamp without time zone := clock_timestamp() AT TIME ZONE 'UTC';
  v_previous_relational text;
BEGIN
  IF v_owner_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required' USING ERRCODE = '42501';
  END IF;
  PERFORM public.assert_character_document_mapped(p_document);

  IF p_client_request_id IS NOT NULL THEN
    SELECT id INTO v_existing_id FROM public.characters
    WHERE user_id = v_owner_id AND client_request_id = p_client_request_id;
    IF v_existing_id IS NOT NULL THEN
      RETURN jsonb_build_object('status','replayed','id',v_existing_id);
    END IF;
  END IF;

  v_previous_relational := current_setting('app.character_relational_write', true);
  PERFORM set_config('app.character_relational_write','on',true);
  INSERT INTO public.characters (
    id, user_id, data, created_at, updated_at, client_request_id,
    name, level, status, visibility
  ) VALUES (
    p_character_id, v_owner_id,
    p_document || jsonb_build_object(
      'id',p_character_id,'userId',v_owner_id,
      'createdAt',to_jsonb(v_now),'updatedAt',to_jsonb(v_now)
    ),
    v_now, v_now, p_client_request_id,
    coalesce(nullif(p_document->>'name',''),'Unnamed'),
    coalesce(nullif(p_document->>'level','')::integer,1),
    nullif(p_document->>'status',''),
    coalesce(nullif(p_document->>'visibility',''),'private')
  );
  PERFORM set_config('app.character_relational_write',coalesce(v_previous_relational,''),true);

  PERFORM public.apply_character_relational_document(p_character_id, p_document, v_now);
  RETURN jsonb_build_object('status','created','id',p_character_id);
EXCEPTION WHEN unique_violation THEN
  IF p_client_request_id IS NOT NULL THEN
    SELECT id INTO v_existing_id FROM public.characters
    WHERE user_id = v_owner_id AND client_request_id = p_client_request_id;
  END IF;
  IF v_existing_id IS NOT NULL THEN
    RETURN jsonb_build_object('status','replayed','id',v_existing_id);
  END IF;
  RAISE;
END;
$fn$;

CREATE OR REPLACE FUNCTION public.patch_character_relational(
  p_character_id text,
  p_patch jsonb,
  p_expected_updated_at text DEFAULT NULL
)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER
SET search_path = pg_catalog, public, auth AS $fn$
DECLARE
  v_owner_id text := auth.uid()::text;
  v_row public.characters%ROWTYPE;
  v_document jsonb;
  v_entry record;
  v_now timestamp without time zone;
BEGIN
  IF v_owner_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required' USING ERRCODE = '42501';
  END IF;
  IF jsonb_typeof(p_patch) IS DISTINCT FROM 'object' THEN
    RAISE EXCEPTION 'Character patch must be an object' USING ERRCODE = '22023';
  END IF;

  SELECT * INTO v_row FROM public.characters
  WHERE id = p_character_id AND user_id = v_owner_id
  FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('status','not_found');
  END IF;

  IF p_expected_updated_at IS NOT NULL
     AND v_row.updated_at IS DISTINCT FROM
       (p_expected_updated_at::timestamptz AT TIME ZONE 'UTC') THEN
    RETURN jsonb_build_object(
      'status','conflict','updatedAt',to_jsonb(v_row.updated_at)
    );
  END IF;

  v_document := public.get_character_relational_document(p_character_id);
  FOR v_entry IN SELECT key, value FROM jsonb_each(p_patch) LOOP
    IF v_entry.key IN ('id','userId','createdAt','updatedAt','lastPlayedAt') THEN
      CONTINUE;
    ELSIF v_entry.value = 'null'::jsonb THEN
      v_document := v_document - v_entry.key;
    ELSE
      v_document := jsonb_set(v_document, ARRAY[v_entry.key], v_entry.value, true);
    END IF;
  END LOOP;

  -- Keep the returned optimistic-lock token at the same precision as the
  -- timestamp(3) column that stores it. Otherwise the next PATCH can compare
  -- the returned microseconds with the stored milliseconds and conflict.
  v_now := greatest(
    clock_timestamp() AT TIME ZONE 'UTC',
    coalesce(v_row.updated_at, clock_timestamp() AT TIME ZONE 'UTC')
      + interval '1 millisecond'
  )::timestamp(3);
  PERFORM public.apply_character_relational_document(p_character_id, v_document, v_now);
  RETURN jsonb_build_object('status','updated','updatedAt',to_jsonb(v_now));
END;
$fn$;

CREATE OR REPLACE FUNCTION public.provision_character_relational(
  p_character_id text,
  p_owner_id text,
  p_document jsonb
)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER
SET search_path = pg_catalog, public AS $fn$
DECLARE
  v_row public.characters%ROWTYPE;
  v_now timestamp without time zone := clock_timestamp() AT TIME ZONE 'UTC';
  v_previous_relational text;
BEGIN
  IF nullif(p_owner_id,'') IS NULL THEN
    RAISE EXCEPTION 'Owner id is required' USING ERRCODE = '22023';
  END IF;
  PERFORM public.assert_character_document_mapped(p_document);
  SELECT * INTO v_row FROM public.characters WHERE id = p_character_id FOR UPDATE;

  IF NOT FOUND THEN
    v_previous_relational := current_setting('app.character_relational_write', true);
    PERFORM set_config('app.character_relational_write','on',true);
    INSERT INTO public.characters (
      id, user_id, data, created_at, updated_at, name, level, status, visibility
    ) VALUES (
      p_character_id, p_owner_id, p_document, v_now, v_now,
      coalesce(nullif(p_document->>'name',''),'Unnamed'),
      coalesce(nullif(p_document->>'level','')::integer,1),
      nullif(p_document->>'status',''),
      coalesce(nullif(p_document->>'visibility',''),'private')
    );
    PERFORM set_config('app.character_relational_write',coalesce(v_previous_relational,''),true);
  ELSIF v_row.user_id IS DISTINCT FROM p_owner_id THEN
    RAISE EXCEPTION 'Provisioning cannot change character owner' USING ERRCODE = '42501';
  END IF;

  PERFORM public.apply_character_relational_document(p_character_id, p_document, v_now);
  RETURN jsonb_build_object('status','upserted','id',p_character_id);
END;
$fn$;

-- Campaign membership, roster, and character visibility are one mutation.
-- These RPCs are service-role only: the server action supplies the verified
-- actor id and server-owned quota values, while the function rechecks campaign
-- and character ownership under row locks before changing anything.
CREATE OR REPLACE FUNCTION public.join_campaign_character_relational(
  p_actor_id text,
  p_invite_code text,
  p_character_id text,
  p_roster_entry jsonb,
  p_expected_updated_at text,
  p_max_campaign_characters integer,
  p_max_players_per_campaign integer
)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER
SET search_path = pg_catalog, public AS $fn$
DECLARE
  v_campaign public.campaigns%ROWTYPE;
  v_character public.characters%ROWTYPE;
  v_roster jsonb;
  v_entry jsonb;
  v_document jsonb;
  v_now timestamp without time zone;
  v_non_owner_members integer;
  v_already_member boolean;
  v_visibility_updated boolean := false;
BEGIN
  IF nullif(p_actor_id,'') IS NULL OR nullif(p_invite_code,'') IS NULL
     OR nullif(p_character_id,'') IS NULL
     OR jsonb_typeof(p_roster_entry) IS DISTINCT FROM 'object'
     OR p_max_campaign_characters < 1 OR p_max_players_per_campaign < 0 THEN
    RAISE EXCEPTION 'Invalid campaign join input' USING ERRCODE = '22023';
  END IF;

  SELECT * INTO v_campaign
  FROM public.campaigns
  WHERE invite_code = p_invite_code
  FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('status','campaign_not_found');
  END IF;

  SELECT * INTO v_character
  FROM public.characters
  WHERE id = p_character_id AND user_id = p_actor_id
  FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('status','character_not_found');
  END IF;

  IF p_expected_updated_at IS NOT NULL
     AND v_character.updated_at IS DISTINCT FROM
       (p_expected_updated_at::timestamptz AT TIME ZONE 'UTC') THEN
    RETURN jsonb_build_object('status','conflict');
  END IF;

  v_roster := CASE WHEN jsonb_typeof(v_campaign.characters) = 'array'
    THEN v_campaign.characters ELSE '[]'::jsonb END;
  IF EXISTS (
    SELECT 1 FROM jsonb_array_elements(v_roster) AS roster(entry)
    WHERE coalesce(entry->>'userId', entry->>'user_id') = p_actor_id
      AND coalesce(entry->>'characterId', entry->>'character_id') = p_character_id
  ) THEN
    RETURN jsonb_build_object('status','already_in_campaign');
  END IF;
  IF jsonb_array_length(v_roster) >= p_max_campaign_characters THEN
    RETURN jsonb_build_object('status','campaign_full');
  END IF;

  IF p_actor_id IS DISTINCT FROM v_campaign.owner_id
     AND EXISTS (
       SELECT 1 FROM jsonb_array_elements(v_roster) AS roster(entry)
       WHERE coalesce(entry->>'userId', entry->>'user_id') = p_actor_id
     ) THEN
    RETURN jsonb_build_object('status','character_limit');
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM public.campaign_members
    WHERE campaign_id = v_campaign.id AND user_id = p_actor_id
  ) INTO v_already_member;

  SELECT count(*) INTO v_non_owner_members
  FROM (
    SELECT user_id
    FROM public.campaign_members
    WHERE campaign_id = v_campaign.id
    UNION
    SELECT coalesce(entry->>'userId', entry->>'user_id')
    FROM jsonb_array_elements(v_roster) AS roster(entry)
  ) AS members(user_id)
  WHERE user_id IS NOT NULL AND user_id <> v_campaign.owner_id;

  IF p_actor_id IS DISTINCT FROM v_campaign.owner_id
     AND NOT v_already_member
     AND v_non_owner_members >= p_max_players_per_campaign THEN
    RETURN jsonb_build_object('status','player_limit');
  END IF;

  v_entry := p_roster_entry || jsonb_build_object(
    'userId', p_actor_id,
    'characterId', p_character_id
  );
  INSERT INTO public.campaign_members (campaign_id, user_id)
  VALUES (v_campaign.id, p_actor_id)
  ON CONFLICT (campaign_id, user_id) DO NOTHING;
  UPDATE public.campaigns
  SET characters = v_roster || jsonb_build_array(v_entry)
  WHERE id = v_campaign.id;

  IF coalesce(v_character.visibility,'private') NOT IN ('campaign','public') THEN
    v_document := public.get_character_relational_document(p_character_id);
    v_document := jsonb_set(v_document, '{visibility}', '"campaign"'::jsonb, true);
    v_now := greatest(
      clock_timestamp() AT TIME ZONE 'UTC',
      coalesce(v_character.updated_at, clock_timestamp() AT TIME ZONE 'UTC')
        + interval '1 millisecond'
    )::timestamp(3);
    PERFORM public.apply_character_relational_document(p_character_id, v_document, v_now);
    v_visibility_updated := true;
  END IF;

  RETURN jsonb_build_object(
    'status','updated',
    'campaignId',v_campaign.id,
    'visibilityUpdated',v_visibility_updated
  );
END;
$fn$;

CREATE OR REPLACE FUNCTION public.add_campaign_character_relational(
  p_actor_id text,
  p_campaign_id text,
  p_character_id text,
  p_roster_entry jsonb,
  p_expected_updated_at text,
  p_max_campaign_characters integer,
  p_owner_max_characters integer
)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER
SET search_path = pg_catalog, public AS $fn$
DECLARE
  v_campaign public.campaigns%ROWTYPE;
  v_character public.characters%ROWTYPE;
  v_roster jsonb;
  v_entry jsonb;
  v_document jsonb;
  v_now timestamp without time zone;
  v_visibility_updated boolean := false;
BEGIN
  IF nullif(p_actor_id,'') IS NULL OR nullif(p_campaign_id,'') IS NULL
     OR nullif(p_character_id,'') IS NULL
     OR jsonb_typeof(p_roster_entry) IS DISTINCT FROM 'object'
     OR p_max_campaign_characters < 1 OR p_owner_max_characters < 1 THEN
    RAISE EXCEPTION 'Invalid campaign add input' USING ERRCODE = '22023';
  END IF;

  SELECT * INTO v_campaign
  FROM public.campaigns
  WHERE id = p_campaign_id
  FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('status','campaign_not_found');
  END IF;
  IF v_campaign.owner_id IS DISTINCT FROM p_actor_id THEN
    RETURN jsonb_build_object('status','forbidden');
  END IF;

  SELECT * INTO v_character
  FROM public.characters
  WHERE id = p_character_id AND user_id = p_actor_id
  FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('status','character_not_found');
  END IF;
  IF p_expected_updated_at IS NOT NULL
     AND v_character.updated_at IS DISTINCT FROM
       (p_expected_updated_at::timestamptz AT TIME ZONE 'UTC') THEN
    RETURN jsonb_build_object('status','conflict');
  END IF;

  v_roster := CASE WHEN jsonb_typeof(v_campaign.characters) = 'array'
    THEN v_campaign.characters ELSE '[]'::jsonb END;
  IF EXISTS (
    SELECT 1 FROM jsonb_array_elements(v_roster) AS roster(entry)
    WHERE coalesce(entry->>'userId', entry->>'user_id') = p_actor_id
      AND coalesce(entry->>'characterId', entry->>'character_id') = p_character_id
  ) THEN
    RETURN jsonb_build_object('status','already_in_campaign');
  END IF;
  IF jsonb_array_length(v_roster) >= p_max_campaign_characters THEN
    RETURN jsonb_build_object('status','campaign_full');
  END IF;
  IF (
    SELECT count(*) FROM jsonb_array_elements(v_roster) AS roster(entry)
    WHERE coalesce(entry->>'userId', entry->>'user_id') = p_actor_id
  ) >= p_owner_max_characters THEN
    RETURN jsonb_build_object('status','character_limit');
  END IF;

  v_entry := p_roster_entry || jsonb_build_object(
    'userId', p_actor_id,
    'characterId', p_character_id
  );
  INSERT INTO public.campaign_members (campaign_id, user_id)
  VALUES (v_campaign.id, p_actor_id)
  ON CONFLICT (campaign_id, user_id) DO NOTHING;
  UPDATE public.campaigns
  SET characters = v_roster || jsonb_build_array(v_entry)
  WHERE id = v_campaign.id;

  IF coalesce(v_character.visibility,'private') NOT IN ('campaign','public') THEN
    v_document := public.get_character_relational_document(p_character_id);
    v_document := jsonb_set(v_document, '{visibility}', '"campaign"'::jsonb, true);
    v_now := greatest(
      clock_timestamp() AT TIME ZONE 'UTC',
      coalesce(v_character.updated_at, clock_timestamp() AT TIME ZONE 'UTC')
        + interval '1 millisecond'
    )::timestamp(3);
    PERFORM public.apply_character_relational_document(p_character_id, v_document, v_now);
    v_visibility_updated := true;
  END IF;

  RETURN jsonb_build_object('status','updated','visibilityUpdated',v_visibility_updated);
END;
$fn$;

CREATE OR REPLACE FUNCTION public.remove_campaign_character_relational(
  p_actor_id text,
  p_campaign_id text,
  p_character_owner_id text,
  p_character_id text
)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER
SET search_path = pg_catalog, public AS $fn$
DECLARE
  v_campaign public.campaigns%ROWTYPE;
  v_roster jsonb;
  v_remaining jsonb;
BEGIN
  IF nullif(p_actor_id,'') IS NULL OR nullif(p_campaign_id,'') IS NULL
     OR nullif(p_character_owner_id,'') IS NULL OR nullif(p_character_id,'') IS NULL THEN
    RAISE EXCEPTION 'Invalid campaign removal input' USING ERRCODE = '22023';
  END IF;

  SELECT * INTO v_campaign
  FROM public.campaigns
  WHERE id = p_campaign_id
  FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('status','campaign_not_found');
  END IF;
  IF v_campaign.owner_id IS DISTINCT FROM p_actor_id
     AND p_character_owner_id IS DISTINCT FROM p_actor_id THEN
    RETURN jsonb_build_object('status','forbidden');
  END IF;

  v_roster := CASE WHEN jsonb_typeof(v_campaign.characters) = 'array'
    THEN v_campaign.characters ELSE '[]'::jsonb END;
  IF NOT EXISTS (
    SELECT 1 FROM jsonb_array_elements(v_roster) AS roster(entry)
    WHERE coalesce(entry->>'userId', entry->>'user_id') = p_character_owner_id
      AND coalesce(entry->>'characterId', entry->>'character_id') = p_character_id
  ) THEN
    RETURN jsonb_build_object('status','character_not_found');
  END IF;

  SELECT coalesce(jsonb_agg(entry ORDER BY position), '[]'::jsonb)
  INTO v_remaining
  FROM jsonb_array_elements(v_roster) WITH ORDINALITY AS roster(entry, position)
  WHERE NOT (
    coalesce(entry->>'userId', entry->>'user_id') = p_character_owner_id
    AND coalesce(entry->>'characterId', entry->>'character_id') = p_character_id
  );

  UPDATE public.campaigns SET characters = v_remaining WHERE id = v_campaign.id;
  IF p_character_owner_id IS DISTINCT FROM v_campaign.owner_id
     AND NOT EXISTS (
       SELECT 1 FROM jsonb_array_elements(v_remaining) AS roster(entry)
       WHERE coalesce(entry->>'userId', entry->>'user_id') = p_character_owner_id
     ) THEN
    DELETE FROM public.campaign_members
    WHERE campaign_id = v_campaign.id AND user_id = p_character_owner_id;
  END IF;

  RETURN jsonb_build_object('status','updated');
END;
$fn$;

-- Existing rows predate the authoritative relational write boundary. Rebuild
-- every rollback mirror from the rows that the reader actually assembles so
-- the compatibility phase begins at exact parity, not only after each
-- character's next application write. Preserve the existing lock token.
DO $canonicalize_existing_mirrors$
DECLARE
  r record;
  v_document jsonb;
BEGIN
  FOR r IN
    SELECT id, updated_at
    FROM public.characters
    ORDER BY id
    FOR UPDATE
  LOOP
    v_document := public.get_character_relational_document(r.id);
    PERFORM public.apply_character_relational_document(
      r.id,
      v_document,
      r.updated_at
    );
  END LOOP;
END;
$canonicalize_existing_mirrors$;

REVOKE ALL ON FUNCTION public.create_character_relational(text,jsonb,uuid)
  FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON FUNCTION public.patch_character_relational(text,jsonb,text)
  FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON FUNCTION public.provision_character_relational(text,text,jsonb)
  FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON FUNCTION public.join_campaign_character_relational(
  text,text,text,jsonb,text,integer,integer
) FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON FUNCTION public.add_campaign_character_relational(
  text,text,text,jsonb,text,integer,integer
) FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON FUNCTION public.remove_campaign_character_relational(text,text,text,text)
  FROM PUBLIC, anon, authenticated, service_role;

GRANT EXECUTE ON FUNCTION public.create_character_relational(text,jsonb,uuid)
  TO authenticated;
GRANT EXECUTE ON FUNCTION public.patch_character_relational(text,jsonb,text)
  TO authenticated;
GRANT EXECUTE ON FUNCTION public.provision_character_relational(text,text,jsonb)
  TO service_role;
GRANT EXECUTE ON FUNCTION public.join_campaign_character_relational(
  text,text,text,jsonb,text,integer,integer
) TO service_role;
GRANT EXECUTE ON FUNCTION public.add_campaign_character_relational(
  text,text,text,jsonb,text,integer,integer
) TO service_role;
GRANT EXECUTE ON FUNCTION public.remove_campaign_character_relational(text,text,text,text)
  TO service_role;

COMMIT;
