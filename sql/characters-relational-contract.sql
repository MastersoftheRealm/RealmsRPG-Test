-- ADR-0031 final contract migration.
-- Apply only after the compatibility cutover, its smoke test, application QA,
-- a fresh production backup, and deployment of the relational-only app code.
-- This transaction refuses to drop the legacy column unless every row is at
-- exact relational parity, then removes the mirror and all write dependencies.
BEGIN;

LOCK TABLE public.characters IN ACCESS EXCLUSIVE MODE;

DO $parity_guard$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM public.characters AS c
    WHERE c.data IS DISTINCT FROM public.get_character_relational_document(c.id)
  ) THEN
    RAISE EXCEPTION
      'Contract migration refused: at least one character differs from its relational document'
      USING ERRCODE = 'check_violation';
  END IF;
END;
$parity_guard$;

DROP TRIGGER IF EXISTS sync_character_data_compat ON public.characters;
DROP FUNCTION IF EXISTS public.sync_character_data_compat_trigger();

ALTER TABLE public.characters DROP COLUMN data;

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
BEGIN
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
  PERFORM set_config('app.character_compat_sync','on',true);

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

  v_document := public.get_character_relational_document(p_character_id);
  IF v_document IS NULL THEN
    RAISE EXCEPTION 'Character % not found after relational projection', p_character_id
      USING ERRCODE = 'P0002';
  END IF;

  PERFORM set_config('app.character_compat_sync',coalesce(v_previous_compat,''),true);
  RETURN v_document;
END;
$fn$;

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

  INSERT INTO public.characters (
    id, user_id, created_at, updated_at, client_request_id,
    name, level, status, visibility
  ) VALUES (
    p_character_id, v_owner_id, v_now, v_now, p_client_request_id,
    coalesce(nullif(p_document->>'name',''),'Unnamed'),
    coalesce(nullif(p_document->>'level','')::integer,1),
    nullif(p_document->>'status',''),
    coalesce(nullif(p_document->>'visibility',''),'private')
  );

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
BEGIN
  IF nullif(p_owner_id,'') IS NULL THEN
    RAISE EXCEPTION 'Owner id is required' USING ERRCODE = '22023';
  END IF;
  PERFORM public.assert_character_document_mapped(p_document);
  SELECT * INTO v_row FROM public.characters WHERE id = p_character_id FOR UPDATE;

  IF NOT FOUND THEN
    INSERT INTO public.characters (
      id, user_id, created_at, updated_at, name, level, status, visibility
    ) VALUES (
      p_character_id, p_owner_id, v_now, v_now,
      coalesce(nullif(p_document->>'name',''),'Unnamed'),
      coalesce(nullif(p_document->>'level','')::integer,1),
      nullif(p_document->>'status',''),
      coalesce(nullif(p_document->>'visibility',''),'private')
    );
  ELSIF v_row.user_id IS DISTINCT FROM p_owner_id THEN
    RAISE EXCEPTION 'Provisioning cannot change character owner' USING ERRCODE = '42501';
  END IF;

  PERFORM public.apply_character_relational_document(p_character_id, p_document, v_now);
  RETURN jsonb_build_object('status','upserted','id',p_character_id);
END;
$fn$;

REVOKE ALL ON FUNCTION public.apply_character_relational_document(
  text,jsonb,timestamp without time zone
) FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON FUNCTION public.create_character_relational(text,jsonb,uuid)
  FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON FUNCTION public.provision_character_relational(text,text,jsonb)
  FROM PUBLIC, anon, authenticated, service_role;

GRANT EXECUTE ON FUNCTION public.create_character_relational(text,jsonb,uuid)
  TO authenticated;
GRANT EXECUTE ON FUNCTION public.provision_character_relational(text,text,jsonb)
  TO service_role;

COMMIT;
