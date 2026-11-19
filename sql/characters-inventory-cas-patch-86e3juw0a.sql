-- Inventory CAS helpers (apply after row-id migration + named backup; agents do not run).
-- Then re-apply expand, read-rpc, write-rpc from the same git commit.
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
      ELSE NULL
    END;
$$;

CREATE OR REPLACE FUNCTION public.inventory_row_cas_snapshot(p_row public.character_inventory)
RETURNS jsonb LANGUAGE sql IMMUTABLE AS $$
  SELECT jsonb_build_object(
    'quantity', p_row.quantity,
    'equipped', p_row.equipped,
    'name', coalesce(p_row.name_snapshot, ''),
    'type', coalesce(p_row.custom_type, ''),
    'description', coalesce(p_row.custom_description, ''),
    'cost', p_row.cost_snapshot
  );
$$;

CREATE OR REPLACE FUNCTION public.inventory_patch_field_clear(
  p_item jsonb,
  p_key text,
  OUT p_clear boolean,
  OUT p_value text
)
RETURNS record LANGUAGE sql IMMUTABLE AS $$
  SELECT
    (p_item ? p_key AND (p_item->p_key = 'null'::jsonb OR p_item->>p_key = '')),
    CASE
      WHEN NOT (p_item ? p_key) THEN NULL
      WHEN p_item->p_key = 'null'::jsonb OR p_item->>p_key = '' THEN NULL
      ELSE p_item->>p_key
    END;
$$;

CREATE OR REPLACE FUNCTION public.apply_character_inventory_patch(
  p_character_id text,
  p_owner_id text,
  p_patch jsonb
)
RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path = public AS $fn$
DECLARE
  v_op jsonb;
  v_bucket text;
  v_category text;
  v_slot text;
  v_row public.character_inventory;
  v_row_id uuid;
  v_item jsonb;
  v_expected jsonb;
  v_position integer;
  v_max integer;
  v_plan jsonb[] := ARRAY[]::jsonb[];
  v_step jsonb;
  v_created jsonb := '[]'::jsonb;
  v_type record;
  v_description record;
  v_name text;
  v_quantity integer;
  v_equipped boolean;
  v_cost numeric;
  v_inv_row record;
  v_current_pos integer;
BEGIN
  IF jsonb_typeof(p_patch) IS DISTINCT FROM 'object'
     OR jsonb_typeof(p_patch->'ops') IS DISTINCT FROM 'array' THEN
    RAISE EXCEPTION 'inventoryPatch must be an object with ops array'
      USING ERRCODE = '22023';
  END IF;

  -- Phase 1: validate every op (no writes).
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

    IF v_op->>'op' = 'add' THEN
      v_item := v_op->'item';
      IF jsonb_typeof(v_item) IS DISTINCT FROM 'object' THEN
        RAISE EXCEPTION 'Add op requires item object' USING ERRCODE = '22023';
      END IF;
      IF nullif(v_op->>'inventoryRowId','') IS NOT NULL THEN
        PERFORM 1 FROM public.character_inventory
        WHERE inventory_row_id = (v_op->>'inventoryRowId')::uuid;
        IF FOUND THEN
          RAISE EXCEPTION USING ERRCODE = '40001', MESSAGE = 'inventory_cas_conflict';
        END IF;
      END IF;
      v_plan := v_plan || jsonb_build_object('op', v_op);
      CONTINUE;
    END IF;

    v_row_id := nullif(v_op->>'inventoryRowId','')::uuid;
    IF v_row_id IS NULL THEN
      RAISE EXCEPTION 'Inventory patch row requires inventoryRowId' USING ERRCODE = '22023';
    END IF;

    SELECT * INTO v_row
    FROM public.character_inventory i
    WHERE i.character_id = p_character_id AND i.inventory_row_id = v_row_id;

    IF NOT FOUND THEN
      RAISE EXCEPTION USING ERRCODE = '40001', MESSAGE = 'inventory_cas_conflict';
    END IF;

    v_expected := v_op->'expected';
    IF jsonb_typeof(v_expected) IS DISTINCT FROM 'object'
       OR public.inventory_row_cas_snapshot(v_row) IS DISTINCT FROM v_expected THEN
      RAISE EXCEPTION USING ERRCODE = '40001', MESSAGE = 'inventory_cas_conflict';
    END IF;

    IF v_bucket IN ('mainHand','offHand') AND v_row.slot IS DISTINCT FROM v_bucket THEN
      RAISE EXCEPTION USING ERRCODE = '40001', MESSAGE = 'inventory_cas_conflict';
    END IF;

    IF v_row.category IS DISTINCT FROM v_category
       OR (v_slot IS NOT NULL AND v_row.slot IS DISTINCT FROM v_slot AND v_bucket NOT IN ('mainHand','offHand')) THEN
      RAISE EXCEPTION USING ERRCODE = '40001', MESSAGE = 'inventory_cas_conflict';
    END IF;

    v_plan := v_plan || jsonb_build_object('op', v_op, 'row', to_jsonb(v_row));
  END LOOP;

  -- Phase 2: apply (still same transaction; any failure aborts all).
  FOREACH v_step IN ARRAY v_plan LOOP
    v_op := v_step->'op';

    IF v_op->>'op' = 'add' THEN
      v_bucket := v_op->>'bucket';
      SELECT p_category, p_slot INTO v_category, v_slot
      FROM public.inventory_patch_bucket_category(v_bucket);
      v_item := v_op->'item';
      IF v_bucket IN ('mainHand','offHand') AND jsonb_typeof(v_item) = 'object' THEN
        v_item := v_item || jsonb_build_object('type', coalesce(v_item->>'type', 'weapon'));
      END IF;
      IF nullif(v_op->>'inventoryRowId','') IS NOT NULL AND jsonb_typeof(v_item) = 'object' THEN
        v_item := v_item || jsonb_build_object('inventoryRowId', v_op->>'inventoryRowId');
      END IF;
      IF nullif(v_op->>'position','') IS NOT NULL THEN
        v_position := (v_op->>'position')::integer;
        FOR v_inv_row IN
          SELECT inventory_row_id, position
          FROM public.character_inventory
          WHERE character_id = p_character_id AND category = v_category
            AND slot IS NOT DISTINCT FROM v_slot
            AND position >= v_position
          ORDER BY position DESC
        LOOP
          UPDATE public.character_inventory
          SET position = v_inv_row.position + 1
          WHERE inventory_row_id = v_inv_row.inventory_row_id;
        END LOOP;
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
        p_character_id, p_owner_id, v_category, v_position, v_item, v_slot);
      v_row_id := nullif(v_op->>'inventoryRowId','')::uuid;
      IF v_row_id IS NULL AND jsonb_typeof(v_item) = 'object' THEN
        v_row_id := nullif(v_item->>'inventoryRowId','')::uuid;
      END IF;
      IF v_row_id IS NULL THEN
        SELECT inventory_row_id INTO v_row_id
        FROM public.character_inventory
        WHERE character_id = p_character_id AND category = v_category
          AND slot IS NOT DISTINCT FROM v_slot AND position = v_position
        ORDER BY inventory_row_id LIMIT 1;
      END IF;
      IF v_row_id IS NOT NULL THEN
        v_created := v_created || jsonb_build_array(jsonb_build_object(
          'inventoryRowId', v_row_id,
          'bucket', v_bucket,
          'position', v_position
        ));
      END IF;
      CONTINUE;
    END IF;

    v_row := jsonb_populate_record(NULL::public.character_inventory, v_step->'row');
    v_row_id := v_row.inventory_row_id;
    v_item := coalesce(v_op->'item', '{}'::jsonb);

    IF v_op->>'op' = 'remove' THEN
      DELETE FROM public.character_inventory
      WHERE character_id = p_character_id AND inventory_row_id = v_row_id;
      CONTINUE;
    END IF;

    IF v_op->>'op' = 'update' THEN
      v_quantity := v_row.quantity;
      v_equipped := v_row.equipped;
      v_name := v_row.name_snapshot;
      IF v_item ? 'quantity' THEN
        v_quantity := coalesce(nullif(v_item->>'quantity','')::integer, 1);
      END IF;
      IF v_item ? 'equipped' THEN
        v_equipped := coalesce(nullif(v_item->>'equipped','')::boolean, false);
      END IF;
      IF v_item ? 'name' THEN
        v_name := nullif(v_item->>'name', '');
      END IF;
      SELECT * INTO v_type FROM public.inventory_patch_field_clear(v_item, 'type');
      SELECT * INTO v_description FROM public.inventory_patch_field_clear(v_item, 'description');
      v_cost := v_row.cost_snapshot;
      IF v_item ? 'cost' THEN
        IF v_item->'cost' = 'null'::jsonb THEN
          v_cost := NULL;
        ELSE
          v_cost := nullif(v_item->>'cost','')::numeric;
        END IF;
      END IF;
      UPDATE public.character_inventory
      SET quantity = v_quantity,
          equipped = v_equipped,
          name_snapshot = v_name,
          custom_type = CASE WHEN v_type.p_clear THEN NULL
            WHEN v_type.p_value IS NOT NULL THEN v_type.p_value
            ELSE custom_type END,
          custom_description = CASE WHEN v_description.p_clear THEN NULL
            WHEN v_description.p_value IS NOT NULL THEN v_description.p_value
            ELSE custom_description END,
          cost_snapshot = v_cost
      WHERE character_id = p_character_id AND inventory_row_id = v_row_id;
      CONTINUE;
    END IF;

    IF v_op->>'op' = 'reorder' THEN
      v_position := (v_op->>'position')::integer;
      IF v_position IS NULL OR v_position < 1 THEN
        RAISE EXCEPTION 'Reorder position must be >= 1' USING ERRCODE = '22023';
      END IF;

      SELECT position INTO v_current_pos
      FROM public.character_inventory
      WHERE character_id = p_character_id AND inventory_row_id = v_row_id;
      IF NOT FOUND THEN
        RAISE EXCEPTION USING ERRCODE = '40001', MESSAGE = 'inventory_cas_conflict';
      END IF;
      IF v_current_pos = v_position THEN
        CONTINUE;
      END IF;

      SELECT coalesce(max(position), 0) INTO v_max
      FROM public.character_inventory
      WHERE character_id = p_character_id AND category = v_row.category
        AND slot IS NOT DISTINCT FROM v_row.slot;
      IF v_position > v_max + (CASE WHEN v_current_pos > v_position THEN 0 ELSE 1 END) THEN
        RAISE EXCEPTION USING ERRCODE = '40001', MESSAGE = 'inventory_cas_conflict';
      END IF;

      UPDATE public.character_inventory
      SET position = v_max + 100000
      WHERE character_id = p_character_id AND inventory_row_id = v_row_id;

      IF v_current_pos < v_position THEN
        FOR v_inv_row IN
          SELECT inventory_row_id, position
          FROM public.character_inventory
          WHERE character_id = p_character_id AND category = v_row.category
            AND slot IS NOT DISTINCT FROM v_row.slot
            AND position > v_current_pos AND position <= v_position
            AND inventory_row_id IS DISTINCT FROM v_row_id
          ORDER BY position ASC
        LOOP
          UPDATE public.character_inventory
          SET position = v_inv_row.position - 1
          WHERE inventory_row_id = v_inv_row.inventory_row_id;
        END LOOP;
      ELSIF v_current_pos > v_position THEN
        FOR v_inv_row IN
          SELECT inventory_row_id, position
          FROM public.character_inventory
          WHERE character_id = p_character_id AND category = v_row.category
            AND slot IS NOT DISTINCT FROM v_row.slot
            AND position >= v_position AND position < v_current_pos
            AND inventory_row_id IS DISTINCT FROM v_row_id
          ORDER BY position DESC
        LOOP
          UPDATE public.character_inventory
          SET position = v_inv_row.position + 1
          WHERE inventory_row_id = v_inv_row.inventory_row_id;
        END LOOP;
      END IF;

      UPDATE public.character_inventory
      SET position = v_position
      WHERE character_id = p_character_id AND inventory_row_id = v_row_id;
    END IF;
  END LOOP;

  RETURN jsonb_build_object('createdRows', v_created);
END;
$fn$;

REVOKE ALL ON FUNCTION public.apply_character_inventory_patch(text,text,jsonb) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.apply_character_inventory_patch(text,text,jsonb)
  FROM authenticated, service_role;

COMMIT;