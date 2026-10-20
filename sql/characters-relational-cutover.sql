-- ADR-0030 compatibility cutover, phase 1 of 3.
-- Apply after characters-relational-expand.sql and before the read/write RPCs.
-- This remains additive: characters.data is retained as a rollback mirror.
BEGIN;

ALTER TABLE public.characters
  ADD COLUMN IF NOT EXISTS innate_energy integer,
  ADD COLUMN IF NOT EXISTS training_points_spent numeric;

-- Kept separate from the original expansion projector so databases that
-- already ran the reviewed expansion can adopt the two newly-approved fields
-- without replaying the complete expansion migration.
CREATE OR REPLACE FUNCTION public.sync_character_cutover_scalars(
  p_character_id text, p_document jsonb
)
RETURNS void LANGUAGE plpgsql SECURITY INVOKER SET search_path = public AS $fn$
BEGIN
  IF jsonb_typeof(p_document) IS DISTINCT FROM 'object' THEN
    RAISE EXCEPTION 'Character % data must be an object', p_character_id
      USING ERRCODE = '22023';
  END IF;

  UPDATE public.characters SET
    innate_energy = nullif(p_document->>'innateEnergy','')::integer,
    training_points_spent = nullif(p_document->>'trainingPointsSpent','')::numeric
  WHERE id = p_character_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Character % not found', p_character_id USING ERRCODE = 'P0002';
  END IF;
END;
$fn$;

REVOKE ALL ON FUNCTION public.sync_character_cutover_scalars(text,jsonb) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.sync_character_cutover_scalars(text,jsonb)
  FROM anon, authenticated, service_role;

-- Supabase's default function privileges grant these roles directly, so a
-- PUBLIC revoke alone is insufficient for the expansion's internal helpers.
REVOKE ALL ON FUNCTION public.assert_character_document_mapped(jsonb)
  FROM anon, authenticated, service_role;
REVOKE ALL ON FUNCTION public.resolve_character_reference(text,text,text,text)
  FROM anon, authenticated, service_role;
REVOKE ALL ON FUNCTION public.sync_character_scalar_columns(text,jsonb)
  FROM anon, authenticated, service_role;
REVOKE ALL ON FUNCTION public.sync_character_child_tables(text,jsonb)
  FROM anon, authenticated, service_role;
REVOKE ALL ON FUNCTION public.insert_character_inventory_item(
  text,text,text,integer,jsonb,text
) FROM anon, authenticated, service_role;
REVOKE ALL ON FUNCTION public.insert_character_trait_selection(
  text,integer,text,text,text,smallint,text,integer,text,text
) FROM anon, authenticated, service_role;

-- Legacy data writes still project into relational state. Relational RPCs set
-- app.character_relational_write so updating the compatibility mirror does not
-- recurse back through the projectors.
CREATE OR REPLACE FUNCTION public.sync_character_data_compat_trigger()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER
SET search_path = pg_catalog, public AS $fn$
DECLARE v_previous_flag text;
BEGIN
  IF current_setting('app.character_relational_write', true) = 'on' THEN
    RETURN NEW;
  END IF;

  v_previous_flag := current_setting('app.character_compat_sync', true);
  PERFORM set_config('app.character_compat_sync','on',true);
  PERFORM public.sync_character_scalar_columns(NEW.id, NEW.data);
  PERFORM public.sync_character_cutover_scalars(NEW.id, NEW.data);
  PERFORM public.sync_character_child_tables(NEW.id, NEW.data);
  PERFORM set_config('app.character_compat_sync',coalesce(v_previous_flag,''),true);
  RETURN NEW;
END;
$fn$;

DO $backfill$
DECLARE r record;
BEGIN
  FOR r IN SELECT id, data FROM public.characters ORDER BY id FOR UPDATE LOOP
    PERFORM public.sync_character_cutover_scalars(r.id, r.data);
  END LOOP;
END;
$backfill$;

COMMIT;
