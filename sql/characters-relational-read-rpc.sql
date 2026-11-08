-- ADR-0030 compatibility cutover, phase 2 of 3. Apply after
-- characters-relational-cutover.sql. This is a transport assembler, not a
-- persisted JSONB document.
BEGIN;

CREATE OR REPLACE FUNCTION public.get_character_relational_document(p_character_id text)
RETURNS jsonb LANGUAGE sql STABLE SECURITY INVOKER SET search_path = public AS $fn$
SELECT jsonb_strip_nulls(jsonb_build_object(
  'id', c.id,
  'userId', c.user_id,
  'name', c.name,
  'level', c.level,
  'status', c.status,
  'visibility', c.visibility,
  'createdAt', c.created_at,
  'updatedAt', c.updated_at,
  'lastPlayedAt', c.last_played_at,
  'experience', c.experience,
  'portrait', c.portrait,
  'gender', c.gender,
  'description', c.description,
  'notes', c.notes,
  'backstory', c.backstory,
  'appearance', c.appearance,
  'archetypeDesc', c.archetype_desc,
  'age', c.age,
  'height', c.height,
  'weight', c.weight,
  'currency', c.currency,
  'healthPoints', c.health_points,
  'energyPoints', c.energy_points,
  'innateEnergy', c.innate_energy,
  'trainingPointsSpent', c.training_points_spent,
  'currentHealth', c.current_health,
  'currentEnergy', c.current_energy,
  'actionPoints', c.action_points,
  'stateUsesCurrent', c.state_uses_current,
  'unarmedProwess', c.unarmed_prowess,
  'speedBase', c.speed_base,
  'evasionBase', c.evasion_base,
  'pow_prof', c.pow_prof,
  'mart_prof', c.mart_prof,
  'pow_abil', c.pow_abil,
  'mart_abil', c.mart_abil,
  'archetypePathId', coalesce(c.archetype_path_id_snapshot,c.archetype_path_id),
  'archetype', CASE WHEN c.archetype_source_id IS NOT NULL
                         OR c.archetype_category IS NOT NULL
    THEN jsonb_strip_nulls(jsonb_build_object(
      'id', c.archetype_source_id, 'type', c.archetype_category)) END,
  'abilities', jsonb_strip_nulls(jsonb_build_object(
    'strength', c.ability_strength, 'vitality', c.ability_vitality,
    'agility', c.ability_agility, 'acuity', c.ability_acuity,
    'intelligence', c.ability_intelligence, 'charisma', c.ability_charisma)),
  'defenseVals', jsonb_strip_nulls(jsonb_build_object(
    'might', c.defense_might, 'fortitude', c.defense_fortitude,
    'reflex', c.defense_reflex, 'discernment', c.defense_discernment,
    'mentalFortitude', c.defense_mental_fortitude, 'resolve', c.defense_resolve)),
  'ancestry', CASE WHEN c.ancestry_id_snapshot IS NOT NULL
                         OR c.ancestry_name_snapshot IS NOT NULL
    THEN jsonb_strip_nulls(jsonb_build_object(
      'id', c.ancestry_id_snapshot,
      'name', c.ancestry_name_snapshot,
      'size', c.ancestry_size,
      'speed', c.ancestry_speed,
      'mixed', CASE WHEN c.ancestry_mixed THEN true END,
      'selectedSize', c.ancestry_selected_size,
      'selectedFlawSpeciesId', c.ancestry_flaw_species_source_id,
      'mixedPhysical', CASE WHEN num_nonnulls(c.ancestry_mixed_height,
        c.ancestry_mixed_weight,c.ancestry_mixed_adulthood,
        c.ancestry_mixed_max_age) > 0 THEN jsonb_strip_nulls(jsonb_build_object(
          'aveHeight',c.ancestry_mixed_height,
          'aveWeight',c.ancestry_mixed_weight,
          'adulthood',c.ancestry_mixed_adulthood,
          'maxAge',c.ancestry_mixed_max_age)) END,
      'speciesIds', CASE WHEN c.ancestry_mixed THEN
        (SELECT coalesce(jsonb_agg(s.source_id ORDER BY s.position),'[]'::jsonb)
         FROM public.character_species s WHERE s.character_id=c.id) END,
      'speciesNames', CASE WHEN c.ancestry_mixed THEN
        (SELECT coalesce(jsonb_agg(s.name_snapshot ORDER BY s.position),'[]'::jsonb)
         FROM public.character_species s WHERE s.character_id=c.id) END,
      'selectedTraits', (SELECT coalesce(jsonb_agg(t.source_id ORDER BY t.position),'[]'::jsonb)
        FROM public.character_traits t WHERE t.character_id=c.id
          AND t.selection_role='ancestry'),
      'selectedFlaw', (SELECT t.source_id FROM public.character_traits t
        WHERE t.character_id=c.id AND t.selection_role='flaw'
        ORDER BY t.position LIMIT 1),
      'selectedCharacteristic', (SELECT t.source_id FROM public.character_traits t
        WHERE t.character_id=c.id AND t.selection_role='characteristic'
        ORDER BY t.position LIMIT 1),
      'selectedSpeciesTraits', CASE WHEN c.ancestry_mixed THEN
        (SELECT coalesce(jsonb_agg(t.source_id ORDER BY t.species_position),'[]'::jsonb)
         FROM public.character_traits t WHERE t.character_id=c.id
           AND t.selection_role='species') END,
      'selectedSpeciesSkillIds', CASE WHEN c.ancestry_mixed THEN
        (SELECT coalesce(jsonb_agg(s.source_id ORDER BY s.species_selection_position),'[]'::jsonb)
         FROM public.character_skills s WHERE s.character_id=c.id
           AND s.species_selected) END,
      'selectedSpeciesTraitChoices',
        (SELECT jsonb_object_agg(t.option_parent_source_id,t.source_id)
         FROM public.character_traits t WHERE t.character_id=c.id
           AND t.selection_role='choice')
    )) END
) || jsonb_build_object(
  'feats', (SELECT coalesce(jsonb_agg(jsonb_strip_nulls(jsonb_build_object(
      'id',f.source_id,'name',f.name_snapshot,
      'description',f.description_snapshot,'currentUses',f.current_uses,
      'customName',f.custom_name,'note',f.note)) ORDER BY f.position),'[]'::jsonb)
    FROM public.character_feats f WHERE f.character_id=c.id AND f.feat_kind='character'),
  'archetypeFeats', (SELECT coalesce(jsonb_agg(jsonb_strip_nulls(jsonb_build_object(
      'id',f.source_id,'name',f.name_snapshot,
      'description',f.description_snapshot,'currentUses',f.current_uses,
      'customName',f.custom_name,'note',f.note)) ORDER BY f.position),'[]'::jsonb)
    FROM public.character_feats f WHERE f.character_id=c.id AND f.feat_kind='archetype'),
  'skills', (SELECT coalesce(jsonb_agg(jsonb_strip_nulls(jsonb_build_object(
      'id',s.source_id,'name',s.name_snapshot,'skill_val',s.skill_val,
      'prof',s.proficient,'ability',s.selected_ability,
      'selectedBaseSkillId',s.selected_base_skill_source_id,
      'category',s.category_snapshot,'baseSkill',s.base_skill_snapshot))
      ORDER BY s.position),'[]'::jsonb)
    FROM public.character_skills s WHERE s.character_id=c.id AND s.selection_present),
  'powers', (SELECT coalesce(jsonb_agg(jsonb_strip_nulls(jsonb_build_object(
      'id',p.source_id,'name',p.name_snapshot,'innate',p.innate,
      'selectedVariantId',p.selected_variant_id)) ORDER BY p.position),'[]'::jsonb)
    FROM public.character_powers p WHERE p.character_id=c.id),
  'techniques', (SELECT coalesce(jsonb_agg(jsonb_strip_nulls(jsonb_build_object(
      'id',t.source_id,'name',t.name_snapshot)) ORDER BY t.position),'[]'::jsonb)
    FROM public.character_techniques t WHERE t.character_id=c.id),
  'traits', (SELECT jsonb_agg(coalesce(t.name_snapshot,t.source_id) ORDER BY t.position)
    FROM public.character_traits t WHERE t.character_id=c.id AND t.selection_role='owned'),
  'traitUses', (SELECT jsonb_object_agg(t.name_snapshot,t.current_uses)
    FROM public.character_traits t WHERE t.character_id=c.id AND t.selection_role='uses'),
  'traitCustomizations', (SELECT jsonb_object_agg(t.source_id,
      jsonb_strip_nulls(jsonb_build_object('customName',t.custom_name,'note',t.note)))
    FROM public.character_traits t WHERE t.character_id=c.id
      AND t.selection_role='customization'),
  'conditions', (SELECT coalesce(jsonb_agg(jsonb_strip_nulls(jsonb_build_object(
      'name',x.name,'level',x.level,'decaying',x.decaying,
      'description',x.description)) ORDER BY x.position),'[]'::jsonb)
    FROM public.character_conditions x WHERE x.character_id=c.id),
  'namedNotes', (SELECT coalesce(jsonb_agg(jsonb_strip_nulls(jsonb_build_object(
      'id',n.note_id,'name',n.name,'content',n.content,
      'hidden',n.hidden)) ORDER BY n.position),'[]'::jsonb)
    FROM public.character_named_notes n WHERE n.character_id=c.id),
  'archetypeChoices', (SELECT jsonb_object_agg(a.milestone_level::text,a.choice)
    FROM public.character_archetype_choices a WHERE a.character_id=c.id),
  'proficiencies', (SELECT coalesce(jsonb_agg(jsonb_strip_nulls(jsonb_build_object(
      'kind',p.kind,'id',p.source_id,'refId',p.ref_id,'name',p.name,
      'damageType',p.damage_type,'op1Level',p.op_1_level,
      'op2Level',p.op_2_level,'op3Level',p.op_3_level,
      'baseTP',p.base_tp,'op1TP',p.op_1_tp,'op2TP',p.op_2_tp,
      'op3TP',p.op_3_tp,'custom',CASE WHEN p.custom THEN true END))
      ORDER BY p.position),'[]'::jsonb)
    FROM public.character_proficiencies p WHERE p.character_id=c.id),
  'equipment', jsonb_build_object(
    'mainHand', (SELECT jsonb_strip_nulls(jsonb_build_object(
      'id',i.source_id,'name',i.name_snapshot,
      'equipped',CASE WHEN i.equipped THEN true END,
      'quantity',CASE WHEN i.quantity<>1 THEN i.quantity END,
      'type',i.custom_type,'description',i.custom_description,
      'cost',i.cost_snapshot))
      FROM public.character_inventory i WHERE i.character_id=c.id
        AND i.slot='mainHand' ORDER BY i.position LIMIT 1),
    'offHand', (SELECT jsonb_strip_nulls(jsonb_build_object(
      'id',i.source_id,'name',i.name_snapshot,
      'equipped',CASE WHEN i.equipped THEN true END,
      'quantity',CASE WHEN i.quantity<>1 THEN i.quantity END,
      'type',i.custom_type,'description',i.custom_description,
      'cost',i.cost_snapshot))
      FROM public.character_inventory i WHERE i.character_id=c.id
        AND i.slot='offHand' ORDER BY i.position LIMIT 1),
    'weapons', (SELECT coalesce(jsonb_agg(jsonb_strip_nulls(jsonb_build_object(
      'id',i.source_id,'name',i.name_snapshot,
      'equipped',CASE WHEN i.equipped THEN true END,
      'quantity',CASE WHEN i.quantity<>1 THEN i.quantity END,
      'type',i.custom_type,'description',i.custom_description,
      'cost',i.cost_snapshot)) ORDER BY i.position),'[]'::jsonb)
      FROM public.character_inventory i WHERE i.character_id=c.id
        AND i.category='weapon' AND i.slot IS NULL),
    'shields', (SELECT coalesce(jsonb_agg(jsonb_strip_nulls(jsonb_build_object(
      'id',i.source_id,'name',i.name_snapshot,
      'equipped',CASE WHEN i.equipped THEN true END,
      'quantity',CASE WHEN i.quantity<>1 THEN i.quantity END,
      'type',i.custom_type,'description',i.custom_description,
      'cost',i.cost_snapshot)) ORDER BY i.position),'[]'::jsonb)
      FROM public.character_inventory i WHERE i.character_id=c.id
        AND i.category='shield' AND i.slot IS NULL),
    'armor', coalesce(
      (SELECT jsonb_strip_nulls(jsonb_build_object(
        'id',i.source_id,'name',i.name_snapshot,
        'equipped',CASE WHEN i.equipped THEN true END,
        'quantity',CASE WHEN i.quantity<>1 THEN i.quantity END,
        'type',i.custom_type,'description',i.custom_description,
        'cost',i.cost_snapshot))
       FROM public.character_inventory i WHERE i.character_id=c.id
         AND i.category='armor' AND i.slot='armor'
       ORDER BY i.position LIMIT 1),
      (SELECT coalesce(jsonb_agg(jsonb_strip_nulls(jsonb_build_object(
        'id',i.source_id,'name',i.name_snapshot,
        'equipped',CASE WHEN i.equipped THEN true END,
        'quantity',CASE WHEN i.quantity<>1 THEN i.quantity END,
        'type',i.custom_type,'description',i.custom_description,
        'cost',i.cost_snapshot)) ORDER BY i.position),'[]'::jsonb)
       FROM public.character_inventory i WHERE i.character_id=c.id
         AND i.category='armor' AND i.slot IS NULL)
    ),
    'items', (SELECT coalesce(jsonb_agg(jsonb_strip_nulls(jsonb_build_object(
      'id',i.source_id,'name',i.name_snapshot,
      'equipped',CASE WHEN i.equipped THEN true END,
      'quantity',CASE WHEN i.quantity<>1 THEN i.quantity END,
      'type',i.custom_type,'description',i.custom_description,
      'cost',i.cost_snapshot)) ORDER BY i.position),'[]'::jsonb)
      FROM public.character_inventory i WHERE i.character_id=c.id
        AND i.category='equipment' AND i.slot IS NULL),
    'accessories', (SELECT coalesce(jsonb_agg(jsonb_strip_nulls(jsonb_build_object(
      'id',i.source_id,'name',i.name_snapshot,
      'equipped',CASE WHEN i.equipped THEN true END,
      'quantity',CASE WHEN i.quantity<>1 THEN i.quantity END,
      'type',i.custom_type,'description',i.custom_description,
      'cost',i.cost_snapshot)) ORDER BY i.position),'[]'::jsonb)
      FROM public.character_inventory i WHERE i.character_id=c.id
        AND i.category='accessory' AND i.slot IS NULL)
  ),
  'baseAbilities', (SELECT jsonb_strip_nulls(jsonb_build_object(
      'strength',a.strength,'vitality',a.vitality,'agility',a.agility,
      'acuity',a.acuity,'intelligence',a.intelligence,'charisma',a.charisma))
    FROM public.character_ability_components a WHERE a.character_id=c.id
      AND a.component_kind='base'),
  'ancestryAbilities', (SELECT jsonb_strip_nulls(jsonb_build_object(
      'strength',a.strength,'vitality',a.vitality,'agility',a.agility,
      'acuity',a.acuity,'intelligence',a.intelligence,'charisma',a.charisma))
    FROM public.character_ability_components a WHERE a.character_id=c.id
      AND a.component_kind='ancestry'),
  'allies', (SELECT jsonb_agg(a.name ORDER BY a.position)
    FROM public.character_affiliations a WHERE a.character_id=c.id
      AND a.affiliation_kind='ally'),
  'organizations', (SELECT jsonb_agg(a.name ORDER BY a.position)
    FROM public.character_affiliations a WHERE a.character_id=c.id
      AND a.affiliation_kind='organization'),
  'speedDisplayUnit', c.speed_display_unit,
  'libraryTabVisibility', CASE WHEN num_nonnulls(
    c.library_powers_visible,c.library_techniques_visible,
    c.library_inventory_visible,c.library_feats_visible,
    c.library_proficiencies_visible,c.library_notes_visible) > 0
    THEN jsonb_strip_nulls(jsonb_build_object(
      'powers',c.library_powers_visible,
      'techniques',c.library_techniques_visible,
      'inventory',c.library_inventory_visible,
      'feats',c.library_feats_visible,
      'proficiencies',c.library_proficiencies_visible,
      'notes',c.library_notes_visible)) END,
  'librarySectionVisibility', (SELECT jsonb_object_agg(p.section_id,p.visible)
    FROM public.character_library_section_preferences p WHERE p.character_id=c.id),
  'notesSectionOrder', (SELECT jsonb_agg(p.section_id ORDER BY p.position)
    FROM public.character_note_section_preferences p
    WHERE p.character_id=c.id AND p.position IS NOT NULL),
  'notesSectionVisibility', (SELECT jsonb_object_agg(p.section_id,p.visible)
    FROM public.character_note_section_preferences p
    WHERE p.character_id=c.id AND p.visible IS NOT NULL),
  'tempModifiers', (SELECT jsonb_strip_nulls(jsonb_build_object(
      'speed',t.speed,'evasion',t.evasion,
      'damageReduction',t.damage_reduction,
      'criticalRange',t.critical_range,'terminal',t.terminal,
      'applyAbilityToResourceMaxima',t.apply_ability_to_resource_maxima,
      'abilities',CASE WHEN num_nonnulls(t.ability_strength,t.ability_vitality,
        t.ability_agility,t.ability_acuity,t.ability_intelligence,
        t.ability_charisma)>0 THEN jsonb_strip_nulls(jsonb_build_object(
          'strength',t.ability_strength,'vitality',t.ability_vitality,
          'agility',t.ability_agility,'acuity',t.ability_acuity,
          'intelligence',t.ability_intelligence,'charisma',t.ability_charisma)) END,
      'defenses',CASE WHEN num_nonnulls(t.defense_might,t.defense_fortitude,
        t.defense_reflex,t.defense_discernment,t.defense_mental_fortitude,
        t.defense_resolve)>0 THEN jsonb_strip_nulls(jsonb_build_object(
          'might',t.defense_might,'fortitude',t.defense_fortitude,
          'reflex',t.defense_reflex,'discernment',t.defense_discernment,
          'mentalFortitude',t.defense_mental_fortitude,
          'resolve',t.defense_resolve)) END,
      'skills',(SELECT jsonb_object_agg(coalesce(s.source_id,s.name_snapshot),s.temp_delta)
        FROM public.character_skills s WHERE s.character_id=c.id
          AND s.temp_delta IS NOT NULL)
    )) FROM public.character_temp_modifiers t WHERE t.character_id=c.id)
))
FROM public.characters c WHERE c.id = p_character_id;
$fn$;

REVOKE ALL ON FUNCTION public.get_character_relational_document(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_character_relational_document(text)
  TO anon, authenticated, service_role;

-- Authorize a campaign character read and assemble its relational document in
-- one database statement. The campaign, membership, roster, character owner,
-- and scalar visibility checks therefore describe the same locked snapshot;
-- the application never needs a service-role fallback between those checks.
CREATE OR REPLACE FUNCTION public.get_campaign_character_relational_document(
  p_campaign_id text,
  p_character_owner_id text,
  p_character_id text
)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER
SET search_path = pg_catalog, public, auth AS $fn$
DECLARE
  v_viewer_id text := auth.uid()::text;
  v_campaign public.campaigns%ROWTYPE;
  v_character public.characters%ROWTYPE;
  v_document jsonb;
  v_visibility text;
BEGIN
  IF v_viewer_id IS NULL THEN
    RETURN jsonb_build_object('status','unauthorized');
  END IF;

  SELECT * INTO v_campaign
  FROM public.campaigns
  WHERE id = p_campaign_id
  FOR SHARE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('status','campaign_not_found');
  END IF;

  IF v_campaign.owner_id IS DISTINCT FROM v_viewer_id THEN
    PERFORM 1
    FROM public.campaign_members
    WHERE campaign_id = p_campaign_id AND user_id = v_viewer_id
    FOR SHARE;
    IF NOT FOUND THEN
      RETURN jsonb_build_object('status','not_member');
    END IF;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM jsonb_array_elements(
      CASE WHEN jsonb_typeof(v_campaign.characters) = 'array'
        THEN v_campaign.characters ELSE '[]'::jsonb END
    ) AS roster(entry)
    WHERE coalesce(entry->>'userId', entry->>'user_id') = p_character_owner_id
      AND coalesce(entry->>'characterId', entry->>'character_id') = p_character_id
  ) THEN
    RETURN jsonb_build_object('status','character_not_rostered');
  END IF;

  SELECT * INTO v_character
  FROM public.characters
  WHERE id = p_character_id AND user_id = p_character_owner_id
  FOR SHARE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('status','character_not_found');
  END IF;

  v_visibility := coalesce(v_character.visibility, 'private');
  IF v_visibility = 'private'
     AND v_viewer_id IS DISTINCT FROM p_character_owner_id
     AND v_viewer_id IS DISTINCT FROM v_campaign.owner_id THEN
    RETURN jsonb_build_object('status','private');
  END IF;

  v_document := public.get_character_relational_document(p_character_id);
  IF v_document IS NULL THEN
    RETURN jsonb_build_object('status','character_not_found');
  END IF;

  RETURN jsonb_build_object('status','ok','character',v_document);
END;
$fn$;

REVOKE ALL ON FUNCTION public.get_campaign_character_relational_document(text,text,text)
  FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_campaign_character_relational_document(text,text,text)
  TO authenticated;

COMMIT;
