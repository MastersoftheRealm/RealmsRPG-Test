-- Serialize role-quota count + insert under a user_profiles row lock.
-- Apply after Kadin explicit OK and a fresh backup (sql/README.md).
BEGIN;

CREATE OR REPLACE FUNCTION public.role_policy_limits_for_role(p_role public."UserRole")
RETURNS TABLE (
  max_characters integer,
  max_custom_powers integer,
  max_custom_techniques integer,
  max_custom_armaments integer,
  max_custom_creatures integer
)
LANGUAGE plpgsql
STABLE
SET search_path = pg_catalog, public AS $fn$
DECLARE
  v_row public.role_policies%ROWTYPE;
BEGIN
  SELECT * INTO v_row FROM public.role_policies WHERE role = p_role;
  IF FOUND THEN
    max_characters := v_row.max_characters;
    max_custom_powers := v_row.max_custom_powers;
    max_custom_techniques := v_row.max_custom_techniques;
    max_custom_armaments := v_row.max_custom_armaments;
    max_custom_creatures := v_row.max_custom_creatures;
    RETURN NEXT;
    RETURN;
  END IF;

  CASE p_role
    WHEN 'new_player' THEN
      max_characters := 3;
      max_custom_powers := 20;
      max_custom_techniques := 20;
      max_custom_armaments := 15;
      max_custom_creatures := 10;
    WHEN 'playtester' THEN
      max_characters := 6;
      max_custom_powers := 35;
      max_custom_techniques := 35;
      max_custom_armaments := 25;
      max_custom_creatures := 25;
    WHEN 'developer' THEN
      max_characters := 15;
      max_custom_powers := 100;
      max_custom_techniques := 100;
      max_custom_armaments := 80;
      max_custom_creatures := 100;
    WHEN 'admin' THEN
      max_characters := 9999;
      max_custom_powers := 9999;
      max_custom_techniques := 9999;
      max_custom_armaments := 9999;
      max_custom_creatures := 9999;
    ELSE
      max_characters := 3;
      max_custom_powers := 20;
      max_custom_techniques := 20;
      max_custom_armaments := 15;
      max_custom_creatures := 10;
  END CASE;
  RETURN NEXT;
END;
$fn$;

REVOKE ALL ON FUNCTION public.role_policy_limits_for_role(public."UserRole")
  FROM PUBLIC, anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION public.lock_user_profile_for_writes(p_user_id text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public AS $fn$
BEGIN
  IF nullif(p_user_id, '') IS NULL THEN
    RAISE EXCEPTION 'User id is required' USING ERRCODE = '22023';
  END IF;
  PERFORM id
  FROM public.user_profiles
  WHERE id = p_user_id
  FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'User profile not found' USING ERRCODE = 'P0002';
  END IF;
END;
$fn$;

REVOKE ALL ON FUNCTION public.lock_user_profile_for_writes(text)
  FROM PUBLIC, anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION public.insert_table_row_from_jsonb_keys(
  p_target regclass,
  p_row jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public AS $fn$
DECLARE
  v_cols text[] := '{}';
  v_selects text[] := '{}';
  v_col record;
  v_sql text;
BEGIN
  IF jsonb_typeof(p_row) IS DISTINCT FROM 'object' THEN
    RAISE EXCEPTION 'Row payload must be a JSON object' USING ERRCODE = '22023';
  END IF;

  FOR v_col IN
    SELECT a.attname AS column_name
    FROM pg_attribute a
    WHERE a.attrelid = p_target
      AND a.attnum > 0
      AND NOT a.attisdropped
  LOOP
    IF p_row ? v_col.column_name THEN
      v_cols := array_append(v_cols, quote_ident(v_col.column_name));
      v_selects := array_append(
        v_selects,
        format('(_src.v_populated).%I', v_col.column_name)
      );
    END IF;
  END LOOP;

  IF coalesce(array_length(v_cols, 1), 0) < 1 THEN
    RAISE EXCEPTION 'Row payload has no insertable columns' USING ERRCODE = '22023';
  END IF;

  v_sql := format(
    'INSERT INTO %s (%s) SELECT %s FROM (SELECT jsonb_populate_record(null::%s, $1) AS v_populated) AS _src',
    p_target,
    array_to_string(v_cols, ', '),
    array_to_string(v_selects, ', '),
    p_target
  );
  EXECUTE v_sql USING p_row;
END;
$fn$;

REVOKE ALL ON FUNCTION public.insert_table_row_from_jsonb_keys(regclass, jsonb)
  FROM PUBLIC, anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION public.assert_account_create_quota(
  p_user_id text,
  p_resource text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public AS $fn$
DECLARE
  v_role public."UserRole";
  v_limits record;
  v_count integer;
  v_max integer;
BEGIN
  IF nullif(p_user_id, '') IS NULL THEN
    RAISE EXCEPTION 'User id is required' USING ERRCODE = '22023';
  END IF;

  SELECT role INTO v_role
  FROM public.user_profiles
  WHERE id = p_user_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'User profile not found' USING ERRCODE = 'P0002';
  END IF;

  SELECT * INTO v_limits FROM public.role_policy_limits_for_role(v_role) LIMIT 1;

  CASE p_resource
    WHEN 'characters' THEN
      v_max := v_limits.max_characters;
      SELECT count(*)::integer INTO v_count
      FROM public.characters
      WHERE user_id = p_user_id;
    WHEN 'custom_powers' THEN
      v_max := v_limits.max_custom_powers;
      SELECT count(*)::integer INTO v_count
      FROM public.user_powers
      WHERE user_id = p_user_id;
    WHEN 'custom_techniques' THEN
      v_max := v_limits.max_custom_techniques;
      SELECT count(*)::integer INTO v_count
      FROM (
        SELECT 1 FROM public.user_techniques WHERE user_id = p_user_id
        UNION ALL
        SELECT 1 FROM public.user_empowered_techniques WHERE user_id = p_user_id
      ) AS technique_rows;
    WHEN 'custom_armaments' THEN
      v_max := v_limits.max_custom_armaments;
      SELECT count(*)::integer INTO v_count
      FROM public.user_items
      WHERE user_id = p_user_id;
    WHEN 'custom_creatures' THEN
      v_max := v_limits.max_custom_creatures;
      SELECT count(*)::integer INTO v_count
      FROM public.user_creatures
      WHERE user_id = p_user_id;
    ELSE
      RAISE EXCEPTION 'Unknown quota resource %', p_resource USING ERRCODE = '22023';
  END CASE;

  IF v_count >= v_max THEN
    RAISE EXCEPTION USING
      ERRCODE = 'P0001',
      MESSAGE = 'ROLE_QUOTA_EXCEEDED',
      DETAIL = json_build_object(
        'resource', p_resource,
        'role', v_role::text,
        'currentCount', v_count,
        'maxAllowed', v_max
      )::text;
  END IF;
END;
$fn$;

REVOKE ALL ON FUNCTION public.assert_account_create_quota(text, text)
  FROM PUBLIC, anon, authenticated, service_role;

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

  PERFORM public.lock_user_profile_for_writes(v_owner_id);

  IF p_client_request_id IS NOT NULL THEN
    SELECT id INTO v_existing_id FROM public.characters
    WHERE user_id = v_owner_id AND client_request_id = p_client_request_id;
    IF v_existing_id IS NOT NULL THEN
      RETURN jsonb_build_object('status','replayed','id',v_existing_id);
    END IF;
  END IF;

  PERFORM public.assert_account_create_quota(v_owner_id, 'characters');

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

CREATE OR REPLACE FUNCTION public.insert_user_library_row_with_quota(
  p_library_kind text,
  p_row jsonb
)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER
SET search_path = pg_catalog, public, auth AS $fn$
DECLARE
  v_owner_id text := auth.uid()::text;
  v_row_user_id text := coalesce(nullif(p_row->>'user_id',''), nullif(p_row->>'userId',''));
  v_id text := coalesce(nullif(p_row->>'id',''), nullif(p_row->>'docId',''));
BEGIN
  IF v_owner_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required' USING ERRCODE = '42501';
  END IF;
  IF v_row_user_id IS DISTINCT FROM v_owner_id THEN
    RAISE EXCEPTION 'Row user_id must match caller' USING ERRCODE = '42501';
  END IF;
  IF nullif(v_id,'') IS NULL THEN
    RAISE EXCEPTION 'Row id is required' USING ERRCODE = '22023';
  END IF;

  PERFORM public.lock_user_profile_for_writes(v_owner_id);

  CASE p_library_kind
    WHEN 'powers' THEN
      PERFORM public.assert_account_create_quota(v_owner_id, 'custom_powers');
      PERFORM public.insert_table_row_from_jsonb_keys('public.user_powers'::regclass, p_row);
    WHEN 'techniques' THEN
      PERFORM public.assert_account_create_quota(v_owner_id, 'custom_techniques');
      PERFORM public.insert_table_row_from_jsonb_keys('public.user_techniques'::regclass, p_row);
    WHEN 'empowered-techniques' THEN
      PERFORM public.assert_account_create_quota(v_owner_id, 'custom_techniques');
      PERFORM public.insert_table_row_from_jsonb_keys(
        'public.user_empowered_techniques'::regclass, p_row
      );
    WHEN 'items' THEN
      PERFORM public.assert_account_create_quota(v_owner_id, 'custom_armaments');
      PERFORM public.insert_table_row_from_jsonb_keys('public.user_items'::regclass, p_row);
    WHEN 'creatures' THEN
      PERFORM public.assert_account_create_quota(v_owner_id, 'custom_creatures');
      PERFORM public.insert_table_row_from_jsonb_keys('public.user_creatures'::regclass, p_row);
    WHEN 'species' THEN
      PERFORM public.insert_table_row_from_jsonb_keys('public.user_species'::regclass, p_row);
    ELSE
      RAISE EXCEPTION 'Unknown library kind %', p_library_kind USING ERRCODE = '22023';
  END CASE;

  RETURN jsonb_build_object('id', v_id);
END;
$fn$;

REVOKE ALL ON FUNCTION public.create_character_relational(text,jsonb,uuid)
  FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON FUNCTION public.insert_user_library_row_with_quota(text,jsonb)
  FROM PUBLIC, anon, authenticated, service_role;

GRANT EXECUTE ON FUNCTION public.create_character_relational(text,jsonb,uuid)
  TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.insert_user_library_row_with_quota(text,jsonb)
  TO authenticated, service_role;

COMMIT;
