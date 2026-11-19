-- Inventory CAS helpers (apply after named backup; agents do not run).
--
-- One logical migration, three files from the **same git commit** (in order):
--   1. This file (new helper RPCs only)
--   2. sql/characters-relational-expand.sql   — canonical sync_character_child_tables (skip flag)
--   3. sql/characters-relational-write-rpc.sql — canonical patch_character_relational (inventoryPatch)
--
-- Do not re-apply expand/write-rpc from an older revision after this; those files are the live source of truth.
--
-- Rollback: restore prior CREATE OR REPLACE bodies from git parent of this commit for (2) and (3);
-- DROP the four functions created in (1); restore character_inventory rows from the named backup if needed.
BEGIN;

CREATE OR REPLACE FUNCTION public.inventory_patch_bucket_category(
  p_bucket text,
  OUT p_category text,
  OUT p_slot text
)
RETURNS record LANGUAGE sql IMMUTABLE AS $$
  SELECT
    CASE p_bucket
      WHEN 'weapons' THEN 'weapon'
      WHEN 'shields' THEN 'shield'
      WHEN 'armor' THEN 'armor'
      WHEN 'items' THEN 'equipment'
      WHEN 'accessories' THEN 'accessory'
      WHEN 'mainHand' THEN NULL
      WHEN 'offHand' THEN NULL
      ELSE NULL
    END,
    CASE
      WHEN p_bucket IN ('mainHand', 'offHand') THEN p_bucket
      WHEN p_bucket = 'armor' THEN 'armor'
      ELSE NULL
    END;
$$;

CREATE OR REPLACE FUNCTION public.inventory_patch_row_key(
  p_id text,
  p_name text
)
RETURNS text LANGUAGE sql IMMUTABLE AS $$
  SELECT coalesce(nullif(trim(p_id), ''),
    CASE WHEN nullif(trim(p_name), '') IS NOT NULL THEN 'name:' || trim(p_name) END);
$$;

CREATE OR REPLACE FUNCTION public.find_character_inventory_for_patch(
  p_character_id text,
  p_category text,
  p_slot text,
  p_row_key text
)
RETURNS public.character_inventory LANGUAGE plpgsql STABLE SET search_path = public AS $fn$
DECLARE
  v_row public.character_inventory;
  v_name text;
  v_matches integer;
BEGIN
  IF p_row_key LIKE 'name:%' THEN
    v_name := substring(p_row_key from 6);
    SELECT count(*) INTO v_matches
    FROM public.character_inventory i
    WHERE i.character_id = p_character_id
      AND i.category = p_category
      AND i.slot IS NOT DISTINCT FROM p_slot
      AND i.source_id IS NULL
      AND i.name_snapshot = v_name;
    IF v_matches > 1 THEN
      RAISE EXCEPTION 'Ambiguous id-less inventory row % in %', v_name, p_category
        USING ERRCODE = '23514';
    END IF;
    IF v_matches = 0 THEN
      RETURN NULL;
    END IF;
    SELECT * INTO STRICT v_row
    FROM public.character_inventory i
    WHERE i.character_id = p_character_id
      AND i.category = p_category
      AND i.slot IS NOT DISTINCT FROM p_slot
      AND i.source_id IS NULL
      AND i.name_snapshot = v_name;
    RETURN v_row;
  END IF;

  SELECT * INTO v_row
  FROM public.character_inventory i
  WHERE i.character_id = p_character_id
    AND i.category = p_category
    AND i.slot IS NOT DISTINCT FROM p_slot
    AND i.source_id = p_row_key
  ORDER BY i.position
  LIMIT 1;
  RETURN v_row;
END;
$fn$;

CREATE OR REPLACE FUNCTION public.apply_character_inventory_patch(
  p_character_id text,
  p_owner_id text,
  p_patch jsonb
)
RETURNS boolean LANGUAGE plpgsql SECURITY INVOKER SET search_path = public AS $fn$
DECLARE
  v_op jsonb;
  v_bucket text;
  v_category text;
  v_slot text;
  v_row public.character_inventory;
  v_row_key text;
  v_expected integer;
  v_position integer;
  v_item jsonb;
  v_hand_category text;
  v_max integer;
BEGIN
  IF jsonb_typeof(p_patch) IS DISTINCT FROM 'object'
     OR jsonb_typeof(p_patch->'ops') IS DISTINCT FROM 'array' THEN
    RAISE EXCEPTION 'inventoryPatch must be an object with ops array'
      USING ERRCODE = '22023';
  END IF;

  FOR v_op IN SELECT value FROM jsonb_array_elements(p_patch->'ops') LOOP
    IF v_op->>'op' NOT IN ('add','update','remove','reorder') THEN
      RAISE EXCEPTION 'Unknown inventory patch op %', v_op->>'op' USING ERRCODE = '22023';
    END IF;
    v_bucket := v_op->>'bucket';
    IF v_bucket NOT IN ('weapons','shields','armor','items','accessories','mainHand','offHand') THEN
      RAISE EXCEPTION 'Unknown inventory patch bucket %', v_bucket USING ERRCODE = '22023';
    END IF;
    SELECT p_category, p_slot INTO v_category, v_slot
    FROM public.inventory_patch_bucket_category(v_bucket);

    IF v_bucket IN ('mainHand','offHand') THEN
      v_item := coalesce(v_op->'item', '{}'::jsonb);
      IF v_op->>'op' = 'add' OR v_op->>'op' = 'update' THEN
        v_hand_category := CASE
          WHEN coalesce(v_item->>'type', v_op->>'type') = 'shield' THEN 'shield'
          WHEN coalesce(v_item->>'type', v_op->>'type') = 'armor' THEN 'armor'
          ELSE 'weapon'
        END;
      ELSE
        SELECT category INTO v_hand_category
        FROM public.character_inventory
        WHERE character_id = p_character_id AND slot = v_bucket
        ORDER BY position LIMIT 1;
        IF NOT FOUND THEN
          RETURN false;
        END IF;
      END IF;
      v_category := v_hand_category;
      v_slot := v_bucket;
    END IF;

    v_row_key := public.inventory_patch_row_key(
      coalesce(v_op->>'id', v_op#>>'{item,id}'),
      coalesce(v_op#>>'{item,name}', '')
    );
    IF v_row_key IS NULL THEN
      RAISE EXCEPTION 'Inventory patch row requires id or unique name' USING ERRCODE = '22023';
    END IF;

    v_row := public.find_character_inventory_for_patch(
      p_character_id, v_category, v_slot, v_row_key);
    v_expected := coalesce(nullif(v_op->>'expectedQuantity','')::integer, 1);

    IF v_op->>'op' = 'add' THEN
      IF v_row.character_id IS NOT NULL THEN
        RETURN false;
      END IF;
      v_item := v_op->'item';
      IF v_bucket IN ('mainHand','offHand') AND jsonb_typeof(v_item) = 'object' THEN
        v_item := v_item || jsonb_build_object('type', coalesce(v_item->>'type', 'weapon'));
      END IF;
      IF nullif(v_op->>'position','') IS NOT NULL THEN
        v_position := (v_op->>'position')::integer;
      ELSE
        SELECT coalesce(max(position),0) + 1 INTO v_position
        FROM public.character_inventory
        WHERE character_id = p_character_id AND category = v_category
          AND slot IS NOT DISTINCT FROM v_slot;
      END IF;
      IF v_bucket IN ('mainHand','offHand') THEN
        DELETE FROM public.character_inventory
        WHERE character_id = p_character_id AND slot = v_bucket;
        v_position := 1;
      END IF;
      PERFORM public.insert_character_inventory_item(
        p_character_id, p_owner_id, v_category, v_position, v_item,
        CASE WHEN v_slot IN ('mainHand','offHand','armor') THEN v_slot ELSE NULL END);
      CONTINUE;
    END IF;

    IF v_row.character_id IS NULL OR v_row.quantity IS DISTINCT FROM v_expected THEN
      RETURN false;
    END IF;

    IF v_op->>'op' = 'remove' THEN
      DELETE FROM public.character_inventory
      WHERE character_id = p_character_id AND category = v_category
        AND position = v_row.position AND slot IS NOT DISTINCT FROM v_slot
        AND quantity = v_expected;
      IF NOT FOUND THEN RETURN false; END IF;
      CONTINUE;
    END IF;

    IF v_op->>'op' = 'update' THEN
      v_item := v_op->'item';
      UPDATE public.character_inventory
      SET quantity = coalesce(nullif(v_item->>'quantity','')::integer, 1),
          equipped = coalesce(nullif(v_item->>'equipped','')::boolean, false),
          name_snapshot = coalesce(nullif(v_item->>'name',''), name_snapshot),
          custom_type = coalesce(v_item->>'type', custom_type),
          custom_description = coalesce(v_item->>'description', custom_description),
          cost_snapshot = coalesce(nullif(v_item->>'cost','')::numeric, cost_snapshot)
      WHERE character_id = p_character_id AND category = v_category
        AND position = v_row.position AND slot IS NOT DISTINCT FROM v_slot
        AND quantity = v_expected;
      IF NOT FOUND THEN RETURN false; END IF;
      CONTINUE;
    END IF;

    IF v_op->>'op' = 'reorder' THEN
      v_position := (v_op->>'position')::integer;
      IF v_position IS NULL OR v_position < 1 THEN
        RAISE EXCEPTION 'Reorder position must be >= 1' USING ERRCODE = '22023';
      END IF;
      IF v_row.position = v_position THEN CONTINUE; END IF;

      SELECT max(position) INTO v_max
      FROM public.character_inventory
      WHERE character_id = p_character_id AND category = v_category
        AND slot IS NOT DISTINCT FROM v_slot;
      IF v_position > coalesce(v_max, 0) + (CASE WHEN v_row.position > v_position THEN 0 ELSE 1 END) THEN
        RETURN false;
      END IF;

      DELETE FROM public.character_inventory
      WHERE character_id = p_character_id AND category = v_category
        AND position = v_row.position AND slot IS NOT DISTINCT FROM v_slot
        AND quantity = v_expected;
      IF NOT FOUND THEN RETURN false; END IF;

      IF v_row.position < v_position THEN
        UPDATE public.character_inventory
        SET position = position - 1
        WHERE character_id = p_character_id AND category = v_category
          AND slot IS NOT DISTINCT FROM v_slot
          AND position > v_row.position AND position <= v_position;
      ELSE
        UPDATE public.character_inventory
        SET position = position + 1
        WHERE character_id = p_character_id AND category = v_category
          AND slot IS NOT DISTINCT FROM v_slot
          AND position >= v_position AND position < v_row.position;
      END IF;

      INSERT INTO public.character_inventory (
        character_id, category, position, source_kind, source_id, name_snapshot,
        slot, official_item_id, user_item_id, codex_equipment_id, quantity,
        equipped, custom_type, custom_description, cost_snapshot
      ) VALUES (
        v_row.character_id, v_row.category, v_position, v_row.source_kind, v_row.source_id,
        v_row.name_snapshot, v_row.slot, v_row.official_item_id, v_row.user_item_id,
        v_row.codex_equipment_id, v_row.quantity, v_row.equipped, v_row.custom_type,
        v_row.custom_description, v_row.cost_snapshot
      );
    END IF;
  END LOOP;

  RETURN true;
END;
$fn$;

REVOKE ALL ON FUNCTION public.apply_character_inventory_patch(text,text,jsonb) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.apply_character_inventory_patch(text,text,jsonb)
  FROM authenticated, service_role;

COMMIT;