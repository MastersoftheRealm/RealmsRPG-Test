-- 86e3juw0a — item-level inventory compare-and-swap on patch saves.
-- Apply only after Kadin's named backup. Do not run from agents.
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
  v_row_key text;
  v_row public.character_inventory;
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



CREATE OR REPLACE FUNCTION public.sync_character_child_tables(
  p_character_id text, p_document jsonb
)
RETURNS void LANGUAGE plpgsql SECURITY INVOKER SET search_path = public AS $fn$
DECLARE
  v_owner_id text;
  v_collection text;
  v_duplicate text;
  v_entry record;
  v_source_id text;
  v_name text;
  v_source_kind text;
  v_reference_id text;
  v_species_ids jsonb;
  v_species_names jsonb;
  v_ancestry jsonb;
  v_equipment jsonb;
  v_position integer;
  v_trait_position integer;
  v_seen text[];
  v_key text;
  v_skip_inventory boolean;
BEGIN
  SELECT user_id INTO v_owner_id FROM public.characters WHERE id = p_character_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Character % not found', p_character_id USING ERRCODE = 'P0002';
  END IF;
  IF jsonb_typeof(p_document) IS DISTINCT FROM 'object' THEN
    RAISE EXCEPTION 'Character data must be an object' USING ERRCODE = '22023';
  END IF;
  PERFORM public.assert_character_document_mapped(p_document);

  v_skip_inventory := current_setting('app.skip_inventory_full_sync', true) = 'on';

  FOREACH v_collection IN ARRAY ARRAY[
    'feats','archetypeFeats','skills','powers','techniques','traits',
    'conditions','namedNotes','proficiencies'
  ] LOOP
    IF p_document ? v_collection AND p_document->v_collection <> 'null'::jsonb
       AND jsonb_typeof(p_document->v_collection) <> 'array'
       AND NOT (v_collection = 'skills'
                AND jsonb_typeof(p_document->v_collection) = 'object') THEN
      RAISE EXCEPTION 'Character % must be an array', v_collection
        USING ERRCODE = '22023';
    END IF;
    SELECT q.ref INTO v_duplicate FROM (
      SELECT coalesce(nullif(x.value->>'id',''), nullif(x.value->>'name',''),
        CASE WHEN jsonb_typeof(x.value) = 'string' THEN x.value #>> '{}' END) AS ref,
        count(DISTINCT x.value) AS versions
      FROM jsonb_array_elements(
        CASE WHEN jsonb_typeof(p_document->v_collection) = 'array'
          THEN p_document->v_collection ELSE '[]'::jsonb END
      ) x GROUP BY 1
    ) q WHERE q.ref IS NOT NULL AND q.versions > 1 LIMIT 1;
    IF FOUND THEN
      RAISE EXCEPTION 'Conflicting duplicate % reference %', v_collection, v_duplicate
        USING ERRCODE = '23514';
    END IF;
  END LOOP;

  DELETE FROM public.character_species WHERE character_id = p_character_id;
  DELETE FROM public.character_feats WHERE character_id = p_character_id;
  DELETE FROM public.character_skills WHERE character_id = p_character_id;
  DELETE FROM public.character_traits WHERE character_id = p_character_id;
  DELETE FROM public.character_powers WHERE character_id = p_character_id;
  DELETE FROM public.character_techniques WHERE character_id = p_character_id;
  IF NOT v_skip_inventory THEN
    DELETE FROM public.character_inventory WHERE character_id = p_character_id;
  END IF;
  DELETE FROM public.character_conditions WHERE character_id = p_character_id;
  DELETE FROM public.character_named_notes WHERE character_id = p_character_id;
  DELETE FROM public.character_library_section_preferences WHERE character_id = p_character_id;
  DELETE FROM public.character_note_section_preferences WHERE character_id = p_character_id;
  DELETE FROM public.character_archetype_choices WHERE character_id = p_character_id;
  DELETE FROM public.character_proficiencies WHERE character_id = p_character_id;
  DELETE FROM public.character_temp_modifiers WHERE character_id = p_character_id;
  DELETE FROM public.character_affiliations WHERE character_id = p_character_id;
  DELETE FROM public.character_ability_components WHERE character_id = p_character_id;

  -- Single species, explicit mixed pair, or the pre-speciesIds mixed:<a>+<b>
  -- legacy alias. Each slot retains the saved source ID/name even if its user
  -- library row is subsequently deleted.
  v_ancestry := p_document->'ancestry';
  IF jsonb_typeof(v_ancestry) = 'object' THEN
    v_species_names := v_ancestry->'speciesNames';
    IF jsonb_typeof(v_ancestry->'speciesIds') = 'array' THEN
      v_species_ids := v_ancestry->'speciesIds';
    ELSIF v_ancestry->>'id' ~ '^mixed:[^+]+\+[^+]+$' THEN
      v_species_ids := jsonb_build_array(
        split_part(split_part(v_ancestry->>'id',':',2),'+',1),
        split_part(split_part(v_ancestry->>'id',':',2),'+',2));
    ELSE
      v_species_ids := jsonb_build_array(v_ancestry->'id');
    END IF;
    IF jsonb_array_length(v_species_ids) > 2 THEN
      RAISE EXCEPTION 'Character ancestry has more than two species'
        USING ERRCODE = '22023';
    END IF;
    FOR v_entry IN SELECT value, ordinality FROM jsonb_array_elements(v_species_ids)
      WITH ORDINALITY LOOP
      v_source_id := nullif(v_entry.value #>> '{}','');
      v_name := CASE
        WHEN jsonb_typeof(v_species_names) = 'array'
          THEN v_species_names->>(v_entry.ordinality::integer - 1)
        WHEN jsonb_array_length(v_species_ids) = 2
          THEN nullif(trim(split_part(v_ancestry->>'name',' / ',v_entry.ordinality::integer)),'')
        ELSE coalesce(v_ancestry->>'name', p_document->>'species') END;
      IF v_source_id IS NULL AND v_name IS NULL THEN CONTINUE; END IF;
      SELECT source_kind, reference_id INTO v_source_kind, v_reference_id
      FROM public.resolve_character_reference('species', v_source_id, v_name, v_owner_id);
      INSERT INTO public.character_species (
        character_id, position, source_kind, source_id, name_snapshot,
        codex_species_id, user_species_id
      ) VALUES (
        p_character_id, v_entry.ordinality, v_source_kind, v_source_id, v_name,
        CASE WHEN v_source_kind = 'codex' THEN v_reference_id END,
        CASE WHEN v_source_kind = 'user' THEN v_reference_id END
      );
    END LOOP;
  ELSIF nullif(p_document->>'species','') IS NOT NULL THEN
    v_name := p_document->>'species';
    SELECT source_kind, reference_id INTO v_source_kind, v_reference_id
    FROM public.resolve_character_reference('species', NULL, v_name, v_owner_id);
    INSERT INTO public.character_species (
      character_id, position, source_kind, name_snapshot,
      codex_species_id, user_species_id
    ) VALUES (
      p_character_id, 1, v_source_kind, v_name,
      CASE WHEN v_source_kind = 'codex' THEN v_reference_id END,
      CASE WHEN v_source_kind = 'user' THEN v_reference_id END
    );
  END IF;

  -- Feats and archetype feats retain first-entry order after exact dedupe.
  FOREACH v_collection IN ARRAY ARRAY['feats','archetypeFeats'] LOOP
    v_seen := ARRAY[]::text[];
    FOR v_entry IN SELECT value, ordinality FROM jsonb_array_elements(
      CASE WHEN jsonb_typeof(p_document->v_collection) = 'array'
        THEN p_document->v_collection ELSE '[]'::jsonb END
    ) WITH ORDINALITY LOOP
      v_source_id := nullif(v_entry.value->>'id','');
      v_name := coalesce(nullif(v_entry.value->>'name',''),
        CASE WHEN jsonb_typeof(v_entry.value) = 'string'
          THEN v_entry.value #>> '{}' END);
      v_key := coalesce(v_source_id, v_name);
      IF v_key = ANY(v_seen) THEN CONTINUE; END IF;
      v_seen := array_append(v_seen, v_key);
      SELECT source_kind, reference_id INTO v_source_kind, v_reference_id
      FROM public.resolve_character_reference('feat', v_source_id, v_name, v_owner_id);
      INSERT INTO public.character_feats (
        character_id, feat_kind, position, feat_id, source_id, name_snapshot,
        description_snapshot, current_uses, custom_name, note
      ) VALUES (
        p_character_id,
        CASE WHEN v_collection = 'feats' THEN 'character' ELSE 'archetype' END,
        v_entry.ordinality,
        CASE WHEN v_source_kind = 'codex' THEN v_reference_id END,
        v_source_id, v_name, v_entry.value->>'description',
        nullif(v_entry.value->>'currentUses','')::integer,
        v_entry.value->>'customName', v_entry.value->>'note'
      );
    END LOOP;
  END LOOP;

  -- Skill rows may be an old id→rank object or current lean row array.
  v_seen := ARRAY[]::text[];
  FOR v_entry IN SELECT value, ordinality FROM jsonb_array_elements(
    CASE WHEN jsonb_typeof(p_document->'skills') = 'array'
      THEN p_document->'skills'
      WHEN jsonb_typeof(p_document->'skills') = 'object' THEN
        (SELECT coalesce(jsonb_agg(jsonb_build_object('id',key,'skill_val',value)
          ORDER BY key),'[]'::jsonb) FROM jsonb_each(p_document->'skills'))
      ELSE '[]'::jsonb END
  ) WITH ORDINALITY LOOP
    v_source_id := nullif(v_entry.value->>'id','');
    v_name := coalesce(nullif(v_entry.value->>'name',''),
      CASE WHEN jsonb_typeof(v_entry.value) = 'string'
        THEN v_entry.value #>> '{}' END);
    v_key := coalesce(v_source_id, v_name);
    IF v_key = ANY(v_seen) THEN CONTINUE; END IF;
    v_seen := array_append(v_seen, v_key);
    SELECT source_kind, reference_id INTO v_source_kind, v_reference_id
    FROM public.resolve_character_reference('skill', v_source_id, v_name, v_owner_id);
    INSERT INTO public.character_skills (
      character_id, position, skill_id, source_id, name_snapshot,
      category_snapshot, base_skill_snapshot, skill_val, proficient,
      selected_ability, selected_base_skill_source_id, selected_base_skill_id
    ) VALUES (
      p_character_id, v_entry.ordinality,
      CASE WHEN v_source_kind = 'codex' THEN v_reference_id END,
      v_source_id, v_name, v_entry.value->>'category', v_entry.value->>'baseSkill',
      coalesce(nullif(v_entry.value->>'skill_val','')::integer, 0),
      coalesce(nullif(v_entry.value->>'prof','')::boolean, false),
      v_entry.value->>'ability', v_entry.value->>'selectedBaseSkillId',
      (SELECT id FROM public.codex_skills
        WHERE id = v_entry.value->>'selectedBaseSkillId')
    );
  END LOOP;

  FOR v_entry IN SELECT value, ordinality FROM jsonb_array_elements(
    CASE WHEN jsonb_typeof(v_ancestry->'selectedSpeciesSkillIds') = 'array'
      THEN v_ancestry->'selectedSpeciesSkillIds' ELSE '[]'::jsonb END
  ) WITH ORDINALITY LOOP
    v_source_id := v_entry.value #>> '{}';
    UPDATE public.character_skills
    SET species_selected = true,
        species_selection_position = v_entry.ordinality::smallint
    WHERE character_id = p_character_id AND source_id = v_source_id;
    IF NOT FOUND THEN
      SELECT source_kind, reference_id INTO v_source_kind, v_reference_id
      FROM public.resolve_character_reference('skill', v_source_id, NULL, v_owner_id);
      SELECT coalesce(max(position),0) + 1 INTO v_position
      FROM public.character_skills WHERE character_id = p_character_id;
      INSERT INTO public.character_skills (
        character_id, position, skill_id, source_id, name_snapshot,
        selection_present, species_selected, species_selection_position
      ) VALUES (
        p_character_id, v_position,
        CASE WHEN v_source_kind = 'codex' THEN v_reference_id END,
        v_source_id,
        (SELECT name FROM public.codex_skills WHERE id = v_reference_id),
        false, true, v_entry.ordinality::smallint
      );
    END IF;
  END LOOP;

  FOR v_entry IN SELECT key, value FROM jsonb_each_text(
    CASE WHEN jsonb_typeof(p_document#>'{tempModifiers,skills}') = 'object'
      THEN p_document#>'{tempModifiers,skills}' ELSE '{}'::jsonb END
  ) LOOP
    UPDATE public.character_skills SET temp_delta = v_entry.value::integer
    WHERE character_id = p_character_id AND source_id = v_entry.key;
    IF NOT FOUND THEN
      SELECT source_kind, reference_id INTO v_source_kind, v_reference_id
      FROM public.resolve_character_reference('skill', v_entry.key, NULL, v_owner_id);
      SELECT coalesce(max(position),0) + 1 INTO v_position
      FROM public.character_skills WHERE character_id = p_character_id;
      INSERT INTO public.character_skills (
        character_id, position, skill_id, source_id, name_snapshot,
        selection_present, temp_delta
      ) VALUES (
        p_character_id, v_position,
        CASE WHEN v_source_kind = 'codex' THEN v_reference_id END,
        v_entry.key,
        (SELECT name FROM public.codex_skills WHERE id = v_reference_id),
        false, v_entry.value::integer
      );
    END IF;
  END LOOP;

  -- Trait selection/state is split by role, preserving mixed-species slot and
  -- single-species option-parent relationships. Name-keyed use counters are
  -- kept by name even when several Codex traits share that name.
  v_trait_position := 0;
  FOR v_entry IN SELECT value FROM jsonb_array_elements(
    CASE WHEN jsonb_typeof(v_ancestry->'selectedTraits') = 'array'
      THEN v_ancestry->'selectedTraits' ELSE '[]'::jsonb END
  ) LOOP
    v_trait_position := v_trait_position + 1;
    PERFORM public.insert_character_trait_selection(
      p_character_id, v_trait_position, 'ancestry', v_entry.value #>> '{}');
  END LOOP;
  IF nullif(v_ancestry->>'selectedFlaw','') IS NOT NULL THEN
    v_trait_position := v_trait_position + 1;
    PERFORM public.insert_character_trait_selection(
      p_character_id, v_trait_position, 'flaw', v_ancestry->>'selectedFlaw');
  END IF;
  IF nullif(v_ancestry->>'selectedCharacteristic','') IS NOT NULL THEN
    v_trait_position := v_trait_position + 1;
    PERFORM public.insert_character_trait_selection(
      p_character_id, v_trait_position, 'characteristic',
      v_ancestry->>'selectedCharacteristic');
  END IF;
  FOR v_entry IN SELECT value, ordinality FROM jsonb_array_elements(
    CASE WHEN jsonb_typeof(v_ancestry->'selectedSpeciesTraits') = 'array'
      THEN v_ancestry->'selectedSpeciesTraits' ELSE '[]'::jsonb END
  ) WITH ORDINALITY LOOP
    v_trait_position := v_trait_position + 1;
    PERFORM public.insert_character_trait_selection(
      p_character_id, v_trait_position, 'species', v_entry.value #>> '{}',
      NULL, v_entry.ordinality::smallint);
  END LOOP;
  FOR v_entry IN SELECT key, value FROM jsonb_each_text(
    CASE WHEN jsonb_typeof(v_ancestry->'selectedSpeciesTraitChoices') = 'object'
      THEN v_ancestry->'selectedSpeciesTraitChoices' ELSE '{}'::jsonb END
  ) LOOP
    v_trait_position := v_trait_position + 1;
    PERFORM public.insert_character_trait_selection(
      p_character_id, v_trait_position, 'choice', v_entry.value,
      NULL, NULL, v_entry.key);
  END LOOP;
  FOR v_entry IN SELECT value FROM jsonb_array_elements(
    CASE WHEN jsonb_typeof(p_document->'traits') = 'array'
      THEN p_document->'traits' ELSE '[]'::jsonb END
  ) LOOP
    v_trait_position := v_trait_position + 1;
    IF jsonb_typeof(v_entry.value) = 'string' THEN
      PERFORM public.insert_character_trait_selection(
        p_character_id, v_trait_position, 'owned', NULL, v_entry.value #>> '{}');
    ELSE
      PERFORM public.insert_character_trait_selection(
        p_character_id, v_trait_position, 'owned', v_entry.value->>'id',
        v_entry.value->>'name');
    END IF;
  END LOOP;
  FOR v_entry IN SELECT key, value FROM jsonb_each_text(
    CASE WHEN jsonb_typeof(p_document->'traitUses') = 'object'
      THEN p_document->'traitUses' ELSE '{}'::jsonb END
  ) LOOP
    v_trait_position := v_trait_position + 1;
    PERFORM public.insert_character_trait_selection(
      p_character_id, v_trait_position, 'uses', NULL, v_entry.key,
      NULL, NULL, v_entry.value::integer);
  END LOOP;
  FOR v_entry IN SELECT key, value FROM jsonb_each(
    CASE WHEN jsonb_typeof(p_document->'traitCustomizations') = 'object'
      THEN p_document->'traitCustomizations' ELSE '{}'::jsonb END
  ) LOOP
    v_trait_position := v_trait_position + 1;
    PERFORM public.insert_character_trait_selection(
      p_character_id, v_trait_position, 'customization', v_entry.key,
      NULL, NULL, NULL, NULL,
      v_entry.value->>'customName', v_entry.value->>'note');
  END LOOP;

  -- Power and technique source matches are source-specific FKs. Deletion of
  -- user-library rows later nulls only the FK, not the snapshots.
  v_seen := ARRAY[]::text[];
  FOR v_entry IN SELECT value, ordinality FROM jsonb_array_elements(
    CASE WHEN jsonb_typeof(p_document->'powers') = 'array'
      THEN p_document->'powers' ELSE '[]'::jsonb END
  ) WITH ORDINALITY LOOP
    v_source_id := nullif(v_entry.value->>'id','');
    v_name := coalesce(nullif(v_entry.value->>'name',''),
      CASE WHEN jsonb_typeof(v_entry.value) = 'string'
        THEN v_entry.value #>> '{}' END);
    v_key := coalesce(v_source_id, v_name);
    IF v_key = ANY(v_seen) THEN CONTINUE; END IF;
    v_seen := array_append(v_seen, v_key);
    SELECT source_kind, reference_id INTO v_source_kind, v_reference_id
    FROM public.resolve_character_reference('power', v_source_id, v_name, v_owner_id);
    INSERT INTO public.character_powers (
      character_id, position, source_kind, source_id, name_snapshot,
      official_power_id, user_power_id, innate, selected_variant_id
    ) VALUES (
      p_character_id, v_entry.ordinality, v_source_kind, v_source_id, v_name,
      CASE WHEN v_source_kind = 'official' THEN v_reference_id END,
      CASE WHEN v_source_kind = 'user' THEN v_reference_id END,
      coalesce(nullif(v_entry.value->>'innate','')::boolean,false),
      v_entry.value->>'selectedVariantId'
    );
  END LOOP;

  v_seen := ARRAY[]::text[];
  FOR v_entry IN SELECT value, ordinality FROM jsonb_array_elements(
    CASE WHEN jsonb_typeof(p_document->'techniques') = 'array'
      THEN p_document->'techniques' ELSE '[]'::jsonb END
  ) WITH ORDINALITY LOOP
    v_source_id := nullif(v_entry.value->>'id','');
    v_name := coalesce(nullif(v_entry.value->>'name',''),
      CASE WHEN jsonb_typeof(v_entry.value) = 'string'
        THEN v_entry.value #>> '{}' END);
    v_key := coalesce(v_source_id, v_name);
    IF v_key = ANY(v_seen) THEN CONTINUE; END IF;
    v_seen := array_append(v_seen, v_key);
    SELECT source_kind, reference_id INTO v_source_kind, v_reference_id
    FROM public.resolve_character_reference('technique', v_source_id, v_name, v_owner_id);
    INSERT INTO public.character_techniques (
      character_id, position, source_kind, source_id, name_snapshot,
      official_technique_id, user_technique_id, official_empowered_id, user_empowered_id
    ) VALUES (
      p_character_id, v_entry.ordinality, v_source_kind, v_source_id, v_name,
      CASE WHEN v_source_kind = 'official' THEN v_reference_id END,
      CASE WHEN v_source_kind = 'user' THEN v_reference_id END,
      CASE WHEN v_source_kind = 'official_empowered' THEN v_reference_id END,
      CASE WHEN v_source_kind = 'user_empowered' THEN v_reference_id END
    );
  END LOOP;

  -- Current saver uses weapons/shields/armor/items/accessories. Legacy
  -- inventory is accepted only if identical to items; otherwise it is unique
  -- information and the migration fails until explicitly mapped.
  IF NOT v_skip_inventory THEN
  v_equipment := p_document->'equipment';
  IF jsonb_typeof(v_equipment) = 'object' THEN
    IF v_equipment ? 'inventory' AND v_equipment->'inventory' <> 'null'::jsonb
       AND v_equipment->'inventory' IS DISTINCT FROM v_equipment->'items' THEN
      RAISE EXCEPTION 'Non-duplicate equipment.inventory needs review'
        USING ERRCODE = '22023';
    END IF;
    FOR v_entry IN SELECT key, value FROM jsonb_each(v_equipment)
      ORDER BY CASE WHEN key IN ('mainHand','offHand') THEN 1 ELSE 0 END, key LOOP
      IF v_entry.key NOT IN ('weapons','shields','armor','items','accessories',
                             'inventory','mainHand','offHand') THEN
        RAISE EXCEPTION 'Unknown equipment key %', v_entry.key USING ERRCODE = '22023';
      END IF;
      IF v_entry.key IN ('weapons','shields','armor','items','accessories') THEN
        IF jsonb_typeof(v_entry.value) = 'array' THEN
          FOR v_position IN 1..jsonb_array_length(v_entry.value) LOOP
            PERFORM public.insert_character_inventory_item(
              p_character_id, v_owner_id,
              CASE v_entry.key WHEN 'weapons' THEN 'weapon'
                WHEN 'shields' THEN 'shield' WHEN 'items' THEN 'equipment'
                WHEN 'accessories' THEN 'accessory' ELSE 'armor' END,
              v_position, v_entry.value->(v_position - 1));
          END LOOP;
        ELSIF v_entry.value <> 'null'::jsonb THEN
          IF v_entry.key <> 'armor' THEN
            RAISE EXCEPTION 'Equipment % must be an array', v_entry.key
              USING ERRCODE = '22023';
          END IF;
          PERFORM public.insert_character_inventory_item(
            p_character_id, v_owner_id, 'armor', 1, v_entry.value, 'armor');
        END IF;
      ELSIF v_entry.key IN ('mainHand','offHand')
            AND v_entry.value <> 'null'::jsonb THEN
        v_collection := CASE
          WHEN v_entry.value->>'type' = 'shield' THEN 'shield'
          WHEN v_entry.value->>'type' = 'armor' THEN 'armor'
          ELSE 'weapon' END;
        SELECT coalesce(max(position),0) + 1 INTO v_position
        FROM public.character_inventory
        WHERE character_id = p_character_id AND category = v_collection;
        PERFORM public.insert_character_inventory_item(
          p_character_id, v_owner_id, v_collection, v_position,
          v_entry.value, v_entry.key);
      END IF;
    END LOOP;
  END IF;
  END IF;

  FOR v_entry IN SELECT value, ordinality FROM jsonb_array_elements(
    CASE WHEN jsonb_typeof(p_document->'conditions') = 'array'
      THEN p_document->'conditions' ELSE '[]'::jsonb END
  ) WITH ORDINALITY LOOP
    INSERT INTO public.character_conditions (
      character_id, position, name, level, decaying, description
    ) VALUES (
      p_character_id, v_entry.ordinality, v_entry.value->>'name',
      coalesce(nullif(v_entry.value->>'level','')::integer,1),
      coalesce(nullif(v_entry.value->>'decaying','')::boolean,false),
      v_entry.value->>'description'
    );
  END LOOP;

  FOR v_entry IN SELECT value, ordinality FROM jsonb_array_elements(
    CASE WHEN jsonb_typeof(p_document->'namedNotes') = 'array'
      THEN p_document->'namedNotes' ELSE '[]'::jsonb END
  ) WITH ORDINALITY LOOP
    INSERT INTO public.character_named_notes (
      character_id, position, note_id, name, content, hidden
    ) VALUES (
      p_character_id, v_entry.ordinality, v_entry.value->>'id',
      v_entry.value->>'name', coalesce(v_entry.value->>'content',''),
      nullif(v_entry.value->>'hidden','')::boolean
    );
  END LOOP;

  FOR v_entry IN SELECT key, value FROM jsonb_each(
    CASE WHEN jsonb_typeof(p_document->'librarySectionVisibility') = 'object'
      THEN p_document->'librarySectionVisibility' ELSE '{}'::jsonb END
  ) LOOP
    INSERT INTO public.character_library_section_preferences (
      character_id, section_id, visible
    ) VALUES (
      p_character_id, v_entry.key, (v_entry.value #>> '{}')::boolean
    );
  END LOOP;

  FOR v_entry IN SELECT value, ordinality FROM jsonb_array_elements(
    CASE WHEN jsonb_typeof(p_document->'notesSectionOrder') = 'array'
      THEN p_document->'notesSectionOrder' ELSE '[]'::jsonb END
  ) WITH ORDINALITY LOOP
    INSERT INTO public.character_note_section_preferences (
      character_id, section_id, position
    ) VALUES (
      p_character_id, v_entry.value #>> '{}', v_entry.ordinality
    );
  END LOOP;

  FOR v_entry IN SELECT key, value FROM jsonb_each(
    CASE WHEN jsonb_typeof(p_document->'notesSectionVisibility') = 'object'
      THEN p_document->'notesSectionVisibility' ELSE '{}'::jsonb END
  ) LOOP
    INSERT INTO public.character_note_section_preferences (
      character_id, section_id, visible
    ) VALUES (
      p_character_id, v_entry.key, (v_entry.value #>> '{}')::boolean
    ) ON CONFLICT (character_id, section_id) DO UPDATE
      SET visible = EXCLUDED.visible;
  END LOOP;

  FOR v_entry IN SELECT key, value FROM jsonb_each_text(
    CASE WHEN jsonb_typeof(p_document->'archetypeChoices') = 'object'
      THEN p_document->'archetypeChoices' ELSE '{}'::jsonb END
  ) LOOP
    INSERT INTO public.character_archetype_choices (
      character_id, milestone_level, choice
    ) VALUES (p_character_id, v_entry.key::integer, v_entry.value);
  END LOOP;

  v_seen := ARRAY[]::text[];
  FOR v_entry IN SELECT value, ordinality FROM jsonb_array_elements(
    CASE WHEN jsonb_typeof(p_document->'proficiencies') = 'array'
      THEN p_document->'proficiencies' ELSE '[]'::jsonb END
  ) WITH ORDINALITY LOOP
    v_key := coalesce(v_entry.value->>'id',v_entry.value->>'name');
    IF v_key = ANY(v_seen) THEN CONTINUE; END IF;
    v_seen := array_append(v_seen, v_key);
    v_source_id := nullif(v_entry.value->>'refId','');
    v_name := v_entry.value->>'name';
    IF v_entry.value->>'kind' = 'custom' THEN
      v_source_kind := 'unresolved'; v_reference_id := NULL;
    ELSE
      SELECT source_kind, reference_id INTO v_source_kind, v_reference_id
      FROM public.resolve_character_reference(
        CASE WHEN v_entry.value->>'kind' = 'item_property' THEN 'property'
          ELSE 'part' END, v_source_id, v_name, v_owner_id);
    END IF;
    INSERT INTO public.character_proficiencies (
      character_id, position, kind, source_id, ref_id, name, part_id,
      property_id, damage_type, op_1_level, op_2_level, op_3_level,
      base_tp, op_1_tp, op_2_tp, op_3_tp, custom
    ) VALUES (
      p_character_id, v_entry.ordinality, v_entry.value->>'kind',
      v_entry.value->>'id', v_source_id, v_name,
      CASE WHEN v_entry.value->>'kind' IN ('power_part','technique_part')
             AND v_source_kind = 'codex' THEN v_reference_id END,
      CASE WHEN v_entry.value->>'kind' = 'item_property'
             AND v_source_kind = 'codex' THEN v_reference_id END,
      v_entry.value->>'damageType',
      nullif(v_entry.value->>'op1Level','')::integer,
      nullif(v_entry.value->>'op2Level','')::integer,
      nullif(v_entry.value->>'op3Level','')::integer,
      nullif(v_entry.value->>'baseTP','')::numeric,
      nullif(v_entry.value->>'op1TP','')::numeric,
      nullif(v_entry.value->>'op2TP','')::numeric,
      nullif(v_entry.value->>'op3TP','')::numeric,
      coalesce(nullif(v_entry.value->>'custom','')::boolean,false)
    );
  END LOOP;

  IF jsonb_typeof(p_document->'tempModifiers') = 'object' THEN
    INSERT INTO public.character_temp_modifiers (
      character_id, speed, evasion, damage_reduction, critical_range, terminal,
      ability_strength, ability_vitality, ability_agility, ability_acuity,
      ability_intelligence, ability_charisma, defense_might, defense_fortitude,
      defense_reflex, defense_discernment, defense_mental_fortitude,
      defense_resolve, apply_ability_to_resource_maxima
    ) VALUES (
      p_character_id,
      nullif(p_document#>>'{tempModifiers,speed}','')::integer,
      nullif(p_document#>>'{tempModifiers,evasion}','')::integer,
      nullif(p_document#>>'{tempModifiers,damageReduction}','')::integer,
      nullif(p_document#>>'{tempModifiers,criticalRange}','')::integer,
      nullif(p_document#>>'{tempModifiers,terminal}','')::integer,
      nullif(p_document#>>'{tempModifiers,abilities,strength}','')::integer,
      nullif(p_document#>>'{tempModifiers,abilities,vitality}','')::integer,
      nullif(p_document#>>'{tempModifiers,abilities,agility}','')::integer,
      nullif(p_document#>>'{tempModifiers,abilities,acuity}','')::integer,
      nullif(p_document#>>'{tempModifiers,abilities,intelligence}','')::integer,
      nullif(p_document#>>'{tempModifiers,abilities,charisma}','')::integer,
      nullif(p_document#>>'{tempModifiers,defenses,might}','')::integer,
      nullif(p_document#>>'{tempModifiers,defenses,fortitude}','')::integer,
      nullif(p_document#>>'{tempModifiers,defenses,reflex}','')::integer,
      nullif(p_document#>>'{tempModifiers,defenses,discernment}','')::integer,
      nullif(p_document#>>'{tempModifiers,defenses,mentalFortitude}','')::integer,
      nullif(p_document#>>'{tempModifiers,defenses,resolve}','')::integer,
      nullif(p_document#>>'{tempModifiers,applyAbilityToResourceMaxima}','')::boolean
    );
  END IF;

  FOREACH v_collection IN ARRAY ARRAY['allies','organizations'] LOOP
    IF p_document ? v_collection AND p_document->v_collection <> 'null'::jsonb
       AND jsonb_typeof(p_document->v_collection) <> 'array' THEN
      RAISE EXCEPTION 'Character % must be an array', v_collection
        USING ERRCODE = '22023';
    END IF;
    FOR v_entry IN SELECT value, ordinality FROM jsonb_array_elements(
      CASE WHEN jsonb_typeof(p_document->v_collection) = 'array'
        THEN p_document->v_collection ELSE '[]'::jsonb END
    ) WITH ORDINALITY LOOP
      IF jsonb_typeof(v_entry.value) = 'object'
         AND EXISTS (SELECT 1 FROM jsonb_object_keys(v_entry.value) k
                     WHERE k <> 'name') THEN
        RAISE EXCEPTION 'Legacy % has unmapped object fields', v_collection
          USING ERRCODE = '22023';
      END IF;
      INSERT INTO public.character_affiliations (
        character_id, affiliation_kind, position, name
      ) VALUES (
        p_character_id,
        CASE WHEN v_collection = 'allies' THEN 'ally' ELSE 'organization' END,
        v_entry.ordinality,
        CASE WHEN jsonb_typeof(v_entry.value) = 'string'
          THEN v_entry.value #>> '{}' ELSE v_entry.value->>'name' END
      );
    END LOOP;
  END LOOP;

  FOREACH v_collection IN ARRAY ARRAY['baseAbilities','ancestryAbilities'] LOOP
    IF p_document ? v_collection AND p_document->v_collection <> 'null'::jsonb THEN
      IF jsonb_typeof(p_document->v_collection) <> 'object' THEN
        RAISE EXCEPTION 'Character % must be an object', v_collection
          USING ERRCODE = '22023';
      END IF;
      INSERT INTO public.character_ability_components (
        character_id, component_kind, strength, vitality, agility,
        acuity, intelligence, charisma
      ) VALUES (
        p_character_id,
        CASE WHEN v_collection = 'baseAbilities' THEN 'base' ELSE 'ancestry' END,
        nullif(p_document#>>ARRAY[v_collection,'strength'],'')::integer,
        nullif(p_document#>>ARRAY[v_collection,'vitality'],'')::integer,
        nullif(p_document#>>ARRAY[v_collection,'agility'],'')::integer,
        nullif(p_document#>>ARRAY[v_collection,'acuity'],'')::integer,
        nullif(p_document#>>ARRAY[v_collection,'intelligence'],'')::integer,
        nullif(p_document#>>ARRAY[v_collection,'charisma'],'')::integer
      );
    END IF;
  END LOOP;
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
  v_inventory_patch jsonb;
  v_skip_sync text;
  v_applied boolean;
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

  v_inventory_patch := p_patch->'inventoryPatch';
  IF p_patch ? 'equipment' THEN
    RAISE EXCEPTION 'Full equipment patches are not supported; send inventoryPatch'
      USING ERRCODE = '22023';
  END IF;

  IF v_inventory_patch IS NOT NULL AND v_inventory_patch <> 'null'::jsonb THEN
    v_applied := public.apply_character_inventory_patch(
      p_character_id, v_owner_id, v_inventory_patch);
    IF NOT v_applied THEN
      SELECT updated_at INTO v_row.updated_at FROM public.characters WHERE id = p_character_id;
      RETURN jsonb_build_object(
        'status','conflict','updatedAt',to_jsonb(v_row.updated_at)
      );
    END IF;
  END IF;

  v_document := public.get_character_relational_document(p_character_id);
  FOR v_entry IN SELECT key, value FROM jsonb_each(p_patch) LOOP
    IF v_entry.key IN ('id','userId','createdAt','updatedAt','lastPlayedAt','inventoryPatch') THEN
      CONTINUE;
    ELSIF v_entry.value = 'null'::jsonb THEN
      v_document := v_document - v_entry.key;
    ELSE
      v_document := jsonb_set(v_document, ARRAY[v_entry.key], v_entry.value, true);
    END IF;
  END LOOP;

  v_now := greatest(
    clock_timestamp() AT TIME ZONE 'UTC',
    coalesce(v_row.updated_at, clock_timestamp() AT TIME ZONE 'UTC')
      + interval '1 millisecond'
  )::timestamp(3);

  v_skip_sync := current_setting('app.skip_inventory_full_sync', true);
  PERFORM set_config('app.skip_inventory_full_sync','on',true);
  PERFORM public.apply_character_relational_document(p_character_id, v_document, v_now);
  PERFORM set_config('app.skip_inventory_full_sync',coalesce(v_skip_sync,''),true);

  RETURN jsonb_build_object('status','updated','updatedAt',to_jsonb(v_now));
END;
$fn$;



COMMIT;
