-- ADR-0030: additive relational character storage.
-- Applied to the owner's local database only. Rerun the audit and obtain
-- explicit high-risk approval before any other target. The final column drop
-- is a separate migration.
BEGIN;

ALTER TABLE public.characters
  ADD COLUMN IF NOT EXISTS experience integer,
  ADD COLUMN IF NOT EXISTS portrait text,
  ADD COLUMN IF NOT EXISTS gender text,
  ADD COLUMN IF NOT EXISTS description text,
  ADD COLUMN IF NOT EXISTS notes text,
  ADD COLUMN IF NOT EXISTS backstory text,
  ADD COLUMN IF NOT EXISTS appearance text,
  ADD COLUMN IF NOT EXISTS archetype_desc text,
  ADD COLUMN IF NOT EXISTS age text,
  ADD COLUMN IF NOT EXISTS height numeric,
  ADD COLUMN IF NOT EXISTS weight numeric,
  ADD COLUMN IF NOT EXISTS currency numeric,
  ADD COLUMN IF NOT EXISTS health_points integer,
  ADD COLUMN IF NOT EXISTS energy_points integer,
  ADD COLUMN IF NOT EXISTS innate_energy integer,
  ADD COLUMN IF NOT EXISTS training_points_spent numeric,
  ADD COLUMN IF NOT EXISTS current_health integer,
  ADD COLUMN IF NOT EXISTS current_energy integer,
  ADD COLUMN IF NOT EXISTS action_points integer,
  ADD COLUMN IF NOT EXISTS state_uses_current integer,
  ADD COLUMN IF NOT EXISTS unarmed_prowess integer,
  ADD COLUMN IF NOT EXISTS speed_base integer,
  ADD COLUMN IF NOT EXISTS evasion_base integer,
  ADD COLUMN IF NOT EXISTS pow_prof integer,
  ADD COLUMN IF NOT EXISTS mart_prof integer,
  ADD COLUMN IF NOT EXISTS pow_abil text,
  ADD COLUMN IF NOT EXISTS mart_abil text,
  ADD COLUMN IF NOT EXISTS archetype_category text,
  ADD COLUMN IF NOT EXISTS archetype_source_id text,
  ADD COLUMN IF NOT EXISTS archetype_id text REFERENCES public.codex_archetypes(id) ON DELETE RESTRICT,
  ADD COLUMN IF NOT EXISTS archetype_path_id text REFERENCES public.codex_archetypes(id) ON DELETE RESTRICT,
  ADD COLUMN IF NOT EXISTS ancestry_mixed boolean,
  ADD COLUMN IF NOT EXISTS ancestry_id_snapshot text,
  ADD COLUMN IF NOT EXISTS ancestry_name_snapshot text,
  ADD COLUMN IF NOT EXISTS ancestry_size text,
  ADD COLUMN IF NOT EXISTS ancestry_speed integer,
  ADD COLUMN IF NOT EXISTS ancestry_selected_size text,
  ADD COLUMN IF NOT EXISTS ancestry_flaw_species_source_id text,
  ADD COLUMN IF NOT EXISTS ancestry_mixed_height numeric,
  ADD COLUMN IF NOT EXISTS ancestry_mixed_weight numeric,
  ADD COLUMN IF NOT EXISTS ancestry_mixed_adulthood numeric,
  ADD COLUMN IF NOT EXISTS ancestry_mixed_max_age numeric,
  ADD COLUMN IF NOT EXISTS speed_display_unit text,
  ADD COLUMN IF NOT EXISTS library_powers_visible boolean,
  ADD COLUMN IF NOT EXISTS library_techniques_visible boolean,
  ADD COLUMN IF NOT EXISTS library_inventory_visible boolean,
  ADD COLUMN IF NOT EXISTS library_feats_visible boolean,
  ADD COLUMN IF NOT EXISTS library_proficiencies_visible boolean,
  ADD COLUMN IF NOT EXISTS library_notes_visible boolean,
  ADD COLUMN IF NOT EXISTS last_played_at timestamp(3) without time zone,
  ADD COLUMN IF NOT EXISTS ability_strength integer,
  ADD COLUMN IF NOT EXISTS ability_vitality integer,
  ADD COLUMN IF NOT EXISTS ability_agility integer,
  ADD COLUMN IF NOT EXISTS ability_acuity integer,
  ADD COLUMN IF NOT EXISTS ability_intelligence integer,
  ADD COLUMN IF NOT EXISTS ability_charisma integer,
  ADD COLUMN IF NOT EXISTS defense_might integer,
  ADD COLUMN IF NOT EXISTS defense_fortitude integer,
  ADD COLUMN IF NOT EXISTS defense_reflex integer,
  ADD COLUMN IF NOT EXISTS defense_discernment integer,
  ADD COLUMN IF NOT EXISTS defense_mental_fortitude integer,
  ADD COLUMN IF NOT EXISTS defense_resolve integer;
CREATE INDEX IF NOT EXISTS characters_archetype_id_idx
  ON public.characters(archetype_id);
CREATE INDEX IF NOT EXISTS characters_archetype_path_id_idx
  ON public.characters(archetype_path_id);

CREATE TABLE IF NOT EXISTS public.character_species (
  character_id text NOT NULL REFERENCES public.characters(id) ON DELETE CASCADE,
  position smallint NOT NULL CHECK (position IN (1,2)),
  source_kind text NOT NULL CHECK (source_kind IN ('codex','user','unresolved')),
  source_id text,
  name_snapshot text,
  codex_species_id text REFERENCES public.codex_species(id) ON DELETE RESTRICT,
  user_species_id text REFERENCES public.user_species(id) ON DELETE SET NULL,
  PRIMARY KEY (character_id, position),
  CHECK (num_nonnulls(codex_species_id, user_species_id) <= 1)
);
CREATE INDEX IF NOT EXISTS character_species_codex_idx
  ON public.character_species(codex_species_id);
CREATE INDEX IF NOT EXISTS character_species_user_idx
  ON public.character_species(user_species_id);

CREATE TABLE IF NOT EXISTS public.character_feats (
  character_id text NOT NULL REFERENCES public.characters(id) ON DELETE CASCADE,
  feat_kind text NOT NULL CHECK (feat_kind IN ('character','archetype')),
  position integer NOT NULL CHECK (position > 0),
  feat_id text REFERENCES public.codex_feats(id) ON DELETE RESTRICT,
  source_id text,
  name_snapshot text,
  description_snapshot text,
  current_uses integer,
  custom_name text,
  note text,
  PRIMARY KEY (character_id, feat_kind, position)
);
CREATE INDEX IF NOT EXISTS character_feats_feat_id_idx ON public.character_feats(feat_id);
CREATE UNIQUE INDEX IF NOT EXISTS character_feats_source_unique_idx
  ON public.character_feats(character_id, feat_kind, source_id)
  WHERE source_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.character_skills (
  character_id text NOT NULL REFERENCES public.characters(id) ON DELETE CASCADE,
  position integer NOT NULL CHECK (position > 0),
  skill_id text REFERENCES public.codex_skills(id) ON DELETE RESTRICT,
  source_id text,
  name_snapshot text,
  category_snapshot text,
  base_skill_snapshot text,
  selection_present boolean NOT NULL DEFAULT true,
  skill_val integer NOT NULL DEFAULT 0,
  proficient boolean NOT NULL DEFAULT false,
  selected_ability text,
  selected_base_skill_source_id text,
  selected_base_skill_id text REFERENCES public.codex_skills(id) ON DELETE RESTRICT,
  species_selected boolean NOT NULL DEFAULT false,
  species_selection_position smallint,
  temp_delta integer,
  PRIMARY KEY (character_id, position)
);
CREATE INDEX IF NOT EXISTS character_skills_skill_id_idx ON public.character_skills(skill_id);
CREATE INDEX IF NOT EXISTS character_skills_base_skill_idx
  ON public.character_skills(selected_base_skill_id);
CREATE UNIQUE INDEX IF NOT EXISTS character_skills_source_unique_idx
  ON public.character_skills(character_id, source_id)
  WHERE source_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.character_traits (
  character_id text NOT NULL REFERENCES public.characters(id) ON DELETE CASCADE,
  position integer NOT NULL CHECK (position > 0),
  selection_role text NOT NULL CHECK (selection_role IN
    ('ancestry','flaw','characteristic','species','choice','owned','uses','customization')),
  species_position smallint CHECK (species_position IS NULL OR species_position IN (1,2)),
  trait_id text REFERENCES public.codex_traits(id) ON DELETE RESTRICT,
  source_id text,
  name_snapshot text,
  option_parent_trait_id text REFERENCES public.codex_traits(id) ON DELETE RESTRICT,
  option_parent_source_id text,
  current_uses integer,
  custom_name text,
  note text,
  PRIMARY KEY (character_id, position)
);
CREATE INDEX IF NOT EXISTS character_traits_trait_id_idx ON public.character_traits(trait_id);
CREATE INDEX IF NOT EXISTS character_traits_option_parent_idx
  ON public.character_traits(option_parent_trait_id);

CREATE TABLE IF NOT EXISTS public.character_powers (
  character_id text NOT NULL REFERENCES public.characters(id) ON DELETE CASCADE,
  position integer NOT NULL CHECK (position > 0),
  source_kind text NOT NULL CHECK (source_kind IN ('official','user','unresolved')),
  source_id text,
  name_snapshot text,
  official_power_id text REFERENCES public.official_powers(id) ON DELETE RESTRICT,
  user_power_id text REFERENCES public.user_powers(id) ON DELETE SET NULL,
  innate boolean NOT NULL DEFAULT false,
  selected_variant_id text,
  PRIMARY KEY (character_id, position),
  CHECK (num_nonnulls(official_power_id, user_power_id) <= 1)
);
CREATE INDEX IF NOT EXISTS character_powers_official_idx ON public.character_powers(official_power_id);
CREATE INDEX IF NOT EXISTS character_powers_user_idx ON public.character_powers(user_power_id);
CREATE UNIQUE INDEX IF NOT EXISTS character_powers_source_unique_idx
  ON public.character_powers(character_id, source_id)
  WHERE source_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.character_techniques (
  character_id text NOT NULL REFERENCES public.characters(id) ON DELETE CASCADE,
  position integer NOT NULL CHECK (position > 0),
  source_kind text NOT NULL CHECK (source_kind IN
    ('official','user','official_empowered','user_empowered','unresolved')),
  source_id text,
  name_snapshot text,
  official_technique_id text REFERENCES public.official_techniques(id) ON DELETE RESTRICT,
  user_technique_id text REFERENCES public.user_techniques(id) ON DELETE SET NULL,
  official_empowered_id text REFERENCES public.official_empowered_techniques(id) ON DELETE RESTRICT,
  user_empowered_id text REFERENCES public.user_empowered_techniques(id) ON DELETE SET NULL,
  PRIMARY KEY (character_id, position),
  CHECK (num_nonnulls(official_technique_id, user_technique_id,
                      official_empowered_id, user_empowered_id) <= 1)
);
CREATE INDEX IF NOT EXISTS character_techniques_official_idx ON public.character_techniques(official_technique_id);
CREATE INDEX IF NOT EXISTS character_techniques_user_idx ON public.character_techniques(user_technique_id);
CREATE INDEX IF NOT EXISTS character_techniques_official_empowered_idx
  ON public.character_techniques(official_empowered_id);
CREATE INDEX IF NOT EXISTS character_techniques_user_empowered_idx
  ON public.character_techniques(user_empowered_id);
CREATE UNIQUE INDEX IF NOT EXISTS character_techniques_source_unique_idx
  ON public.character_techniques(character_id, source_id)
  WHERE source_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.character_inventory (
  character_id text NOT NULL REFERENCES public.characters(id) ON DELETE CASCADE,
  category text NOT NULL CHECK (category IN ('weapon','shield','armor','equipment','accessory')),
  position integer NOT NULL CHECK (position > 0),
  source_kind text NOT NULL CHECK (source_kind IN ('official','user','codex','custom','unresolved')),
  source_id text,
  name_snapshot text,
  slot text,
  official_item_id text REFERENCES public.official_items(id) ON DELETE RESTRICT,
  user_item_id text REFERENCES public.user_items(id) ON DELETE SET NULL,
  codex_equipment_id text REFERENCES public.codex_equipment(id) ON DELETE RESTRICT,
  quantity integer NOT NULL DEFAULT 1 CHECK (quantity >= 0),
  equipped boolean NOT NULL DEFAULT false,
  custom_type text,
  custom_description text,
  cost_snapshot numeric,
  PRIMARY KEY (character_id, category, position),
  CHECK (num_nonnulls(official_item_id, user_item_id, codex_equipment_id) <= 1)
);
CREATE INDEX IF NOT EXISTS character_inventory_official_idx ON public.character_inventory(official_item_id);
CREATE INDEX IF NOT EXISTS character_inventory_user_idx ON public.character_inventory(user_item_id);
CREATE INDEX IF NOT EXISTS character_inventory_codex_idx
  ON public.character_inventory(codex_equipment_id);

CREATE TABLE IF NOT EXISTS public.character_conditions (
  character_id text NOT NULL REFERENCES public.characters(id) ON DELETE CASCADE,
  position integer NOT NULL CHECK (position > 0),
  name text NOT NULL,
  level integer NOT NULL DEFAULT 1,
  decaying boolean NOT NULL DEFAULT false,
  description text,
  PRIMARY KEY (character_id, position)
);

CREATE TABLE IF NOT EXISTS public.character_named_notes (
  character_id text NOT NULL REFERENCES public.characters(id) ON DELETE CASCADE,
  position integer NOT NULL CHECK (position > 0),
  note_id text,
  name text NOT NULL,
  content text NOT NULL DEFAULT '',
  PRIMARY KEY (character_id, position)
);

CREATE TABLE IF NOT EXISTS public.character_archetype_choices (
  character_id text NOT NULL REFERENCES public.characters(id) ON DELETE CASCADE,
  milestone_level integer NOT NULL CHECK (milestone_level > 0),
  choice text NOT NULL CHECK (choice IN ('innate','feat')),
  PRIMARY KEY (character_id, milestone_level)
);

CREATE TABLE IF NOT EXISTS public.character_proficiencies (
  character_id text NOT NULL REFERENCES public.characters(id) ON DELETE CASCADE,
  position integer NOT NULL CHECK (position > 0),
  kind text NOT NULL CHECK (kind IN ('power_part','technique_part','item_property','custom')),
  source_id text,
  ref_id text,
  name text NOT NULL,
  part_id text REFERENCES public.codex_parts(id) ON DELETE RESTRICT,
  property_id text REFERENCES public.codex_properties(id) ON DELETE RESTRICT,
  damage_type text,
  op_1_level integer,
  op_2_level integer,
  op_3_level integer,
  base_tp numeric,
  op_1_tp numeric,
  op_2_tp numeric,
  op_3_tp numeric,
  custom boolean NOT NULL DEFAULT false,
  PRIMARY KEY (character_id, position),
  CHECK (num_nonnulls(part_id, property_id) <= 1)
);
CREATE INDEX IF NOT EXISTS character_proficiencies_part_idx
  ON public.character_proficiencies(part_id);
CREATE INDEX IF NOT EXISTS character_proficiencies_property_idx
  ON public.character_proficiencies(property_id);
CREATE UNIQUE INDEX IF NOT EXISTS character_proficiencies_source_unique_idx
  ON public.character_proficiencies(character_id, source_id)
  WHERE source_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.character_temp_modifiers (
  character_id text PRIMARY KEY REFERENCES public.characters(id) ON DELETE CASCADE,
  speed integer,
  evasion integer,
  damage_reduction integer,
  critical_range integer,
  terminal integer,
  ability_strength integer,
  ability_vitality integer,
  ability_agility integer,
  ability_acuity integer,
  ability_intelligence integer,
  ability_charisma integer,
  defense_might integer,
  defense_fortitude integer,
  defense_reflex integer,
  defense_discernment integer,
  defense_mental_fortitude integer,
  defense_resolve integer,
  apply_ability_to_resource_maxima boolean
);

CREATE TABLE IF NOT EXISTS public.character_affiliations (
  character_id text NOT NULL REFERENCES public.characters(id) ON DELETE CASCADE,
  affiliation_kind text NOT NULL CHECK (affiliation_kind IN ('ally','organization')),
  position integer NOT NULL CHECK (position > 0),
  name text NOT NULL,
  PRIMARY KEY (character_id, affiliation_kind, position)
);

CREATE TABLE IF NOT EXISTS public.character_ability_components (
  character_id text NOT NULL REFERENCES public.characters(id) ON DELETE CASCADE,
  component_kind text NOT NULL CHECK (component_kind IN ('base','ancestry')),
  strength integer,
  vitality integer,
  agility integer,
  acuity integer,
  intelligence integer,
  charisma integer,
  PRIMARY KEY (character_id, component_kind)
);

-- Parent visibility is the read authority. Writes are owner-only. RLS on
-- children prevents direct cross-user access even if a grant is broadened later.
DO $policy$
DECLARE child text;
BEGIN
  FOREACH child IN ARRAY ARRAY[
    'character_species','character_feats','character_skills','character_traits',
    'character_powers','character_techniques','character_inventory',
    'character_conditions','character_named_notes','character_archetype_choices',
    'character_proficiencies','character_temp_modifiers',
    'character_affiliations','character_ability_components'
  ] LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', child);
    EXECUTE format('DROP POLICY IF EXISTS character_child_select ON public.%I', child);
    EXECUTE format('CREATE POLICY character_child_select ON public.%I FOR SELECT TO anon, authenticated USING (EXISTS (SELECT 1 FROM public.characters c WHERE c.id = character_id))', child);
    EXECUTE format('DROP POLICY IF EXISTS character_child_write ON public.%I', child);
    EXECUTE format('CREATE POLICY character_child_write ON public.%I FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.characters c WHERE c.id = character_id AND c.user_id = (SELECT auth.uid())::text)) WITH CHECK (EXISTS (SELECT 1 FROM public.characters c WHERE c.id = character_id AND c.user_id = (SELECT auth.uid())::text))', child);
    EXECUTE format('GRANT SELECT ON public.%I TO anon', child);
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON public.%I TO authenticated', child);
  END LOOP;
END;
$policy$;

-- These identity-backed child tables use bigserial nowhere, so no sequence grant.
-- Foreign ownership is checked when a private-library FK is assigned.
CREATE OR REPLACE FUNCTION public.assert_character_library_owner()
RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path = public AS $fn$
DECLARE owner_id text;
BEGIN
  SELECT user_id INTO owner_id FROM public.characters WHERE id = NEW.character_id;
  IF owner_id IS NULL THEN RAISE EXCEPTION 'Character not found' USING ERRCODE = '23503'; END IF;
  IF TG_TABLE_NAME = 'character_powers' THEN
    IF NEW.user_power_id IS NOT NULL AND NOT EXISTS
      (SELECT 1 FROM public.user_powers WHERE id = NEW.user_power_id AND user_id = owner_id)
    THEN RAISE EXCEPTION 'Power belongs to another user' USING ERRCODE = '23514'; END IF;
  ELSIF TG_TABLE_NAME = 'character_techniques' THEN
    IF NEW.user_technique_id IS NOT NULL AND NOT EXISTS
      (SELECT 1 FROM public.user_techniques WHERE id = NEW.user_technique_id AND user_id = owner_id)
    THEN RAISE EXCEPTION 'Technique belongs to another user' USING ERRCODE = '23514'; END IF;
    IF NEW.user_empowered_id IS NOT NULL AND NOT EXISTS
      (SELECT 1 FROM public.user_empowered_techniques WHERE id = NEW.user_empowered_id AND user_id = owner_id)
    THEN RAISE EXCEPTION 'Empowered technique belongs to another user' USING ERRCODE = '23514'; END IF;
  ELSIF TG_TABLE_NAME = 'character_inventory' THEN
    IF NEW.user_item_id IS NOT NULL AND NOT EXISTS
      (SELECT 1 FROM public.user_items WHERE id = NEW.user_item_id AND user_id = owner_id)
    THEN RAISE EXCEPTION 'Item belongs to another user' USING ERRCODE = '23514'; END IF;
  ELSIF TG_TABLE_NAME = 'character_species' THEN
    IF NEW.user_species_id IS NOT NULL AND NOT EXISTS
      (SELECT 1 FROM public.user_species WHERE id = NEW.user_species_id AND user_id = owner_id)
    THEN RAISE EXCEPTION 'Species belongs to another user' USING ERRCODE = '23514'; END IF;
  END IF;
  RETURN NEW;
END;
$fn$;

DO $triggers$
DECLARE child text;
BEGIN
  FOREACH child IN ARRAY ARRAY['character_species','character_powers',
    'character_techniques','character_inventory'] LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS assert_character_library_owner ON public.%I', child);
    EXECUTE format('CREATE TRIGGER assert_character_library_owner BEFORE INSERT OR UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.assert_character_library_owner()', child);
  END LOOP;
END;
$triggers$;

-- Resolve one saved reference without guessing when names or IDs are
-- ambiguous. `source_id` and `name_snapshot` remain on the child row even
-- when a user-library source has since been deleted.
CREATE OR REPLACE FUNCTION public.resolve_character_reference(
  p_kind text, p_source_id text, p_name text, p_owner_id text
)
RETURNS TABLE (source_kind text, reference_id text)
LANGUAGE plpgsql SECURITY INVOKER SET search_path = public AS $fn$
DECLARE match_count integer;
BEGIN
  IF nullif(p_source_id, '') IS NULL AND nullif(p_name, '') IS NULL THEN
    RAISE EXCEPTION 'Character % reference has neither ID nor name', p_kind
      USING ERRCODE = '22023';
  END IF;

  SELECT count(*)::integer, min(c.source_kind), min(c.id)
  INTO match_count, source_kind, reference_id
  FROM (
    SELECT 'codex'::text AS source_kind, id, name FROM public.codex_species
      WHERE p_kind = 'species'
    UNION ALL SELECT 'user', id, name FROM public.user_species
      WHERE p_kind = 'species' AND user_id = p_owner_id
    UNION ALL SELECT 'codex', id, name FROM public.codex_feats
      WHERE p_kind = 'feat'
    UNION ALL SELECT 'codex', id, name FROM public.codex_skills
      WHERE p_kind = 'skill'
    UNION ALL SELECT 'codex', id, name FROM public.codex_traits
      WHERE p_kind = 'trait'
    UNION ALL SELECT 'codex', id, name FROM public.codex_archetypes
      WHERE p_kind = 'archetype'
    UNION ALL SELECT 'official', id, name FROM public.official_powers
      WHERE p_kind = 'power'
    UNION ALL SELECT 'user', id, name FROM public.user_powers
      WHERE p_kind = 'power' AND user_id = p_owner_id
    UNION ALL SELECT 'official', id, name FROM public.official_techniques
      WHERE p_kind = 'technique'
    UNION ALL SELECT 'user', id, name FROM public.user_techniques
      WHERE p_kind = 'technique' AND user_id = p_owner_id
    UNION ALL SELECT 'official_empowered', id, name
      FROM public.official_empowered_techniques
      WHERE p_kind = 'technique'
    UNION ALL SELECT 'user_empowered', id, name
      FROM public.user_empowered_techniques
      WHERE p_kind = 'technique' AND user_id = p_owner_id
    UNION ALL SELECT 'official', id, name FROM public.official_items
      WHERE p_kind = 'item'
    UNION ALL SELECT 'user', id, name FROM public.user_items
      WHERE p_kind = 'item' AND user_id = p_owner_id
    UNION ALL SELECT 'codex', id, name FROM public.codex_equipment
      WHERE p_kind = 'item'
    UNION ALL SELECT 'codex', id, name FROM public.codex_parts
      WHERE p_kind = 'part'
    UNION ALL SELECT 'codex', id, name FROM public.codex_properties
      WHERE p_kind = 'property'
  ) c
  WHERE (nullif(p_source_id, '') IS NOT NULL AND c.id = p_source_id)
     OR (nullif(p_source_id, '') IS NULL AND p_name IS NOT NULL
         AND lower(c.name) = lower(p_name));

  IF match_count > 1 THEN
    RAISE EXCEPTION 'Ambiguous character % reference (id %, name %)',
      p_kind, p_source_id, p_name USING ERRCODE = '23514';
  END IF;
  IF match_count = 0 THEN
    source_kind := 'unresolved';
    reference_id := NULL;
  END IF;
  RETURN NEXT;
END;
$fn$;

REVOKE ALL ON FUNCTION public.resolve_character_reference(text,text,text,text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.resolve_character_reference(text,text,text,text)
  FROM authenticated, service_role;

-- Scalar half of the legacy-document projection. Existing list columns stay
-- authoritative, including when a JSON key is absent or disagrees. This
-- function does not mutate `data`, `created_at`, or `updated_at`.
CREATE OR REPLACE FUNCTION public.sync_character_scalar_columns(
  p_character_id text, p_document jsonb
)
RETURNS void LANGUAGE plpgsql SECURITY INVOKER SET search_path = public AS $fn$
DECLARE
  d jsonb;
  archetype_ref text;
BEGIN
  IF jsonb_typeof(p_document) IS DISTINCT FROM 'object' THEN
    RAISE EXCEPTION 'Character % data must be an object', p_character_id
      USING ERRCODE = '22023';
  END IF;
  d := coalesce(p_document->'defenseVals', p_document->'defenseSkills');
  archetype_ref := nullif(p_document#>>'{archetype,id}', '');

  UPDATE public.characters c SET
    experience = coalesce(nullif(p_document->>'experience',''),
                          nullif(p_document->>'xp',''))::integer,
    portrait = coalesce(p_document->>'portrait', p_document->>'portraitUrl',
                        p_document->>'portrait_url'),
    gender = p_document->>'gender',
    description = p_document->>'description',
    notes = p_document->>'notes',
    backstory = p_document->>'backstory',
    appearance = p_document->>'appearance',
    archetype_desc = p_document->>'archetypeDesc',
    age = p_document->>'age',
    height = nullif(p_document->>'height','')::numeric,
    weight = nullif(p_document->>'weight','')::numeric,
    currency = nullif(p_document->>'currency','')::numeric,
    health_points = coalesce(nullif(p_document->>'healthPoints',''),
                             nullif(p_document#>>'{health_energy_points,health}',''))::integer,
    energy_points = coalesce(nullif(p_document->>'energyPoints',''),
                             nullif(p_document#>>'{health_energy_points,energy}',''))::integer,
    innate_energy = nullif(p_document->>'innateEnergy','')::integer,
    training_points_spent = nullif(p_document->>'trainingPointsSpent','')::numeric,
    current_health = coalesce(nullif(p_document->>'currentHealth',''),
                              nullif(p_document#>>'{health,current}',''))::integer,
    current_energy = coalesce(nullif(p_document->>'currentEnergy',''),
                              nullif(p_document#>>'{energy,current}',''))::integer,
    action_points = nullif(p_document->>'actionPoints','')::integer,
    state_uses_current = nullif(p_document->>'stateUsesCurrent','')::integer,
    unarmed_prowess = nullif(p_document->>'unarmedProwess','')::integer,
    speed_base = nullif(p_document->>'speedBase','')::integer,
    evasion_base = nullif(p_document->>'evasionBase','')::integer,
    pow_prof = coalesce(nullif(p_document->>'pow_prof',''),
                        nullif(p_document->>'powerProficiency',''))::integer,
    mart_prof = coalesce(nullif(p_document->>'mart_prof',''),
                         nullif(p_document->>'martialProficiency',''))::integer,
    pow_abil = p_document->>'pow_abil',
    mart_abil = p_document->>'mart_abil',
    archetype_category = CASE p_document#>>'{archetype,type}'
      WHEN 'mixed' THEN 'powered-martial'
      ELSE p_document#>>'{archetype,type}' END,
    archetype_source_id = archetype_ref,
    archetype_id = (SELECT a.id FROM public.codex_archetypes a
                    WHERE a.id = archetype_ref),
    archetype_path_id = nullif(p_document->>'archetypePathId',''),
    ancestry_id_snapshot = p_document#>>'{ancestry,id}',
    ancestry_name_snapshot = coalesce(p_document#>>'{ancestry,name}',
                                      p_document->>'species'),
    ancestry_mixed = (p_document#>>'{ancestry,mixed}' = 'true'
                      OR p_document#>>'{ancestry,id}' ~ '^mixed:[^+]+\+[^+]+$'),
    ancestry_size = p_document#>>'{ancestry,size}',
    ancestry_speed = nullif(p_document#>>'{ancestry,speed}','')::integer,
    ancestry_selected_size = p_document#>>'{ancestry,selectedSize}',
    ancestry_flaw_species_source_id = p_document#>>'{ancestry,selectedFlawSpeciesId}',
    ancestry_mixed_height = nullif(p_document#>>'{ancestry,mixedPhysical,aveHeight}','')::numeric,
    ancestry_mixed_weight = nullif(p_document#>>'{ancestry,mixedPhysical,aveWeight}','')::numeric,
    ancestry_mixed_adulthood = nullif(p_document#>>'{ancestry,mixedPhysical,adulthood}','')::numeric,
    ancestry_mixed_max_age = nullif(p_document#>>'{ancestry,mixedPhysical,maxAge}','')::numeric,
    speed_display_unit = p_document->>'speedDisplayUnit',
    library_powers_visible = nullif(p_document#>>'{libraryTabVisibility,powers}','')::boolean,
    library_techniques_visible = nullif(p_document#>>'{libraryTabVisibility,techniques}','')::boolean,
    library_inventory_visible = nullif(p_document#>>'{libraryTabVisibility,inventory}','')::boolean,
    library_feats_visible = nullif(p_document#>>'{libraryTabVisibility,feats}','')::boolean,
    library_proficiencies_visible = nullif(p_document#>>'{libraryTabVisibility,proficiencies}','')::boolean,
    library_notes_visible = nullif(p_document#>>'{libraryTabVisibility,notes}','')::boolean,
    last_played_at = (nullif(p_document->>'lastPlayedAt','')::timestamptz
                      AT TIME ZONE 'UTC'),
    ability_strength = nullif(p_document#>>'{abilities,strength}','')::integer,
    ability_vitality = nullif(p_document#>>'{abilities,vitality}','')::integer,
    ability_agility = nullif(p_document#>>'{abilities,agility}','')::integer,
    ability_acuity = nullif(p_document#>>'{abilities,acuity}','')::integer,
    ability_intelligence = nullif(p_document#>>'{abilities,intelligence}','')::integer,
    ability_charisma = nullif(p_document#>>'{abilities,charisma}','')::integer,
    defense_might = nullif(d->>'might','')::integer,
    defense_fortitude = nullif(d->>'fortitude','')::integer,
    defense_reflex = nullif(d->>'reflex','')::integer,
    defense_discernment = nullif(d->>'discernment','')::integer,
    defense_mental_fortitude = nullif(d->>'mentalFortitude','')::integer,
    defense_resolve = nullif(d->>'resolve','')::integer
  WHERE c.id = p_character_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Character % not found', p_character_id USING ERRCODE = 'P0002';
  END IF;
END;
$fn$;

REVOKE ALL ON FUNCTION public.sync_character_scalar_columns(text,jsonb) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.sync_character_scalar_columns(text,jsonb)
  FROM authenticated, service_role;

CREATE OR REPLACE FUNCTION public.insert_character_inventory_item(
  p_character_id text, p_owner_id text, p_category text,
  p_position integer, p_item jsonb, p_slot text DEFAULT NULL
)
RETURNS void LANGUAGE plpgsql SECURITY INVOKER SET search_path = public AS $fn$
DECLARE
  v_source_id text;
  v_name text;
  v_source_kind text;
  v_reference_id text;
BEGIN
  IF jsonb_typeof(p_item) NOT IN ('object','string') THEN
    RAISE EXCEPTION 'Malformed character inventory item at %/%', p_category, p_position
      USING ERRCODE = '22023';
  END IF;
  IF p_item ? 'properties' AND p_item->'properties' <> '[]'::jsonb THEN
    RAISE EXCEPTION 'Non-empty inventory properties need a typed destination'
      USING ERRCODE = '22023';
  END IF;
  v_source_id := nullif(p_item->>'id','');
  v_name := coalesce(nullif(p_item->>'name',''),
    CASE WHEN jsonb_typeof(p_item) = 'string' THEN p_item #>> '{}' END);
  IF v_source_id LIKE 'custom-%' THEN
    v_source_kind := 'custom';
    v_reference_id := NULL;
  ELSE
    SELECT source_kind, reference_id INTO v_source_kind, v_reference_id
    FROM public.resolve_character_reference('item', v_source_id, v_name, p_owner_id);
  END IF;

  INSERT INTO public.character_inventory (
    character_id, category, position, source_kind, source_id, name_snapshot,
    slot, official_item_id, user_item_id, codex_equipment_id, quantity,
    equipped, custom_type, custom_description, cost_snapshot
  ) VALUES (
    p_character_id, p_category, p_position, v_source_kind, v_source_id, v_name,
    p_slot,
    CASE WHEN v_source_kind = 'official' THEN v_reference_id END,
    CASE WHEN v_source_kind = 'user' THEN v_reference_id END,
    CASE WHEN v_source_kind = 'codex' THEN v_reference_id END,
    coalesce(nullif(p_item->>'quantity','')::integer, 1),
    coalesce(nullif(p_item->>'equipped','')::boolean, false),
    p_item->>'type', p_item->>'description',
    nullif(p_item->>'cost','')::numeric
  );
END;
$fn$;

REVOKE ALL ON FUNCTION public.insert_character_inventory_item(
  text,text,text,integer,jsonb,text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.insert_character_inventory_item(
  text,text,text,integer,jsonb,text) FROM authenticated, service_role;

CREATE OR REPLACE FUNCTION public.insert_character_trait_selection(
  p_character_id text, p_position integer, p_role text,
  p_source_id text, p_name text DEFAULT NULL,
  p_species_position smallint DEFAULT NULL, p_parent_source_id text DEFAULT NULL,
  p_current_uses integer DEFAULT NULL, p_custom_name text DEFAULT NULL,
  p_note text DEFAULT NULL
)
RETURNS void LANGUAGE plpgsql SECURITY INVOKER SET search_path = public AS $fn$
DECLARE
  v_trait_id text;
  v_name text;
  v_matches integer;
BEGIN
  IF p_source_id IS NOT NULL THEN
    SELECT id, name INTO v_trait_id, v_name
    FROM public.codex_traits WHERE id = p_source_id;
  ELSIF p_name IS NOT NULL THEN
    SELECT count(*)::integer, min(id), min(name)
    INTO v_matches, v_trait_id, v_name
    FROM public.codex_traits WHERE lower(name) = lower(p_name);
    IF v_matches <> 1 THEN v_trait_id := NULL; END IF;
  END IF;
  INSERT INTO public.character_traits (
    character_id, position, selection_role, species_position, trait_id,
    source_id, name_snapshot, option_parent_trait_id,
    option_parent_source_id, current_uses, custom_name, note
  ) VALUES (
    p_character_id, p_position, p_role, p_species_position, v_trait_id,
    p_source_id, coalesce(p_name,v_name),
    (SELECT id FROM public.codex_traits WHERE id = p_parent_source_id),
    p_parent_source_id, p_current_uses, p_custom_name, p_note
  );
END;
$fn$;

REVOKE ALL ON FUNCTION public.insert_character_trait_selection(
  text,integer,text,text,text,smallint,text,integer,text,text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.insert_character_trait_selection(
  text,integer,text,text,text,smallint,text,integer,text,text)
  FROM authenticated, service_role;

-- Never project a document with an unknown persisted field. The explicitly
-- allowed derived/legacy keys below are recomputed or have canonical fallbacks;
-- every other key must first receive a relational mapping.
CREATE OR REPLACE FUNCTION public.assert_character_document_mapped(p_document jsonb)
RETURNS void LANGUAGE plpgsql SECURITY INVOKER SET search_path = public AS $fn$
DECLARE
  v_bad text;
  v_shape record;
BEGIN
  IF jsonb_typeof(p_document) IS DISTINCT FROM 'object' THEN
    RAISE EXCEPTION 'Character document must be an object' USING ERRCODE = '22023';
  END IF;
  SELECT key INTO v_bad FROM jsonb_object_keys(p_document) key
  WHERE key <> ALL (ARRAY[
    'id','userId','name','level','status','visibility','createdAt','updatedAt',
    'lastPlayedAt','portrait','portraitUrl','portrait_url','gender','xp',
    'experience','description','notes','namedNotes','backstory','appearance',
    'archetypeDesc','weight','height','age','abilities','baseAbilities',
    'ancestryAbilities','defenseVals','defenseSkills','healthPoints',
    'energyPoints','currentHealth','currentEnergy','actionPoints','health',
    'energy','speedBase','evasionBase','innateEnergy','skills','archetype',
    'archetypePathId','mart_prof','pow_prof','martialProficiency',
    'powerProficiency','mart_abil','pow_abil','archetypeChoices','feats',
    'archetypeFeats','techniques','powers','traits','traitUses',
    'traitCustomizations','stateUsesCurrent','unarmedProwess','equipment',
    'currency','trainingPointsSpent','proficiencies','allies',
    'organizations','speedDisplayUnit','libraryTabVisibility','tempModifiers',
    'ancestry','species','conditions','health_energy_points','creationMode',
    'allTraits','_displayFeats','speciesTraits','defenses','defenseBonuses',
    'speed','evasion','armor'
  ]) LIMIT 1;
  IF FOUND THEN
    RAISE EXCEPTION 'Unmapped character key: %', v_bad USING ERRCODE = '22023';
  END IF;

  FOR v_shape IN SELECT * FROM (VALUES
    ('archetype', ARRAY['id','type']::text[]),
    ('ancestry', ARRAY['id','name','size','speed','selectedTraits','selectedFlaw',
      'selectedCharacteristic','mixed','speciesIds','speciesNames',
      'selectedSize','selectedSpeciesTraits','selectedFlawSpeciesId',
      'mixedPhysical','selectedSpeciesSkillIds','selectedSpeciesTraitChoices']::text[]),
    ('abilities', ARRAY['strength','vitality','agility','acuity','intelligence','charisma']::text[]),
    ('defenseVals', ARRAY['might','fortitude','reflex','discernment','mentalFortitude','resolve']::text[]),
    ('defenseSkills', ARRAY['might','fortitude','reflex','discernment','mentalFortitude','resolve']::text[]),
    ('libraryTabVisibility', ARRAY['powers','techniques','inventory','feats',
      'proficiencies','notes']::text[]),
    ('tempModifiers', ARRAY['speed','evasion','damageReduction','criticalRange',
      'terminal','abilities','defenses','skills','applyAbilityToResourceMaxima']::text[]),
    ('equipment', ARRAY['mainHand','offHand','armor','weapons','shields','items',
      'accessories','inventory']::text[]),
    ('health', ARRAY['current','max']::text[]),
    ('energy', ARRAY['current','max']::text[]),
    ('health_energy_points', ARRAY['health','energy']::text[]),
    ('baseAbilities', ARRAY['strength','vitality','agility','acuity','intelligence','charisma']::text[]),
    ('ancestryAbilities', ARRAY['strength','vitality','agility','acuity','intelligence','charisma']::text[])
  ) s(collection, allowed_keys) LOOP
    IF p_document ? v_shape.collection AND p_document->v_shape.collection <> 'null'::jsonb
       AND jsonb_typeof(p_document->v_shape.collection) <> 'object' THEN
      RAISE EXCEPTION 'Character % must be an object', v_shape.collection
        USING ERRCODE = '22023';
    END IF;
    SELECT e.key INTO v_bad FROM jsonb_each(
      CASE WHEN jsonb_typeof(p_document->v_shape.collection) = 'object'
        THEN p_document->v_shape.collection ELSE '{}'::jsonb END
    ) e WHERE NOT e.key = ANY(v_shape.allowed_keys) LIMIT 1;
    IF FOUND THEN
      RAISE EXCEPTION 'Unmapped character %.%', v_shape.collection, v_bad
        USING ERRCODE = '22023';
    END IF;
  END LOOP;

  FOR v_shape IN SELECT * FROM (VALUES
    ('feats', ARRAY['id','name','description','currentUses','customName','note']::text[]),
    ('archetypeFeats', ARRAY['id','name','description','currentUses','customName','note']::text[]),
    ('powers', ARRAY['id','name','innate','selectedVariantId']::text[]),
    ('techniques', ARRAY['id','name']::text[]),
    ('skills', ARRAY['id','name','skill_val','prof','selectedBaseSkillId',
      'ability','baseSkill','category']::text[]),
    ('traits', ARRAY['id','name']::text[]),
    ('conditions', ARRAY['name','level','decaying','description']::text[]),
    ('namedNotes', ARRAY['id','name','content']::text[]),
    ('proficiencies', ARRAY['kind','id','refId','name','damageType',
      'op1Level','op2Level','op3Level','baseTP','op1TP','op2TP','op3TP','custom']::text[])
  ) s(collection, allowed_keys) LOOP
    SELECT e.key INTO v_bad
    FROM jsonb_array_elements(
      CASE WHEN jsonb_typeof(p_document->v_shape.collection) = 'array'
        THEN p_document->v_shape.collection ELSE '[]'::jsonb END
    ) item
    CROSS JOIN LATERAL jsonb_each(
      CASE WHEN jsonb_typeof(item.value) = 'object'
        THEN item.value ELSE '{}'::jsonb END
    ) e WHERE NOT e.key = ANY(v_shape.allowed_keys) LIMIT 1;
    IF FOUND THEN
      RAISE EXCEPTION 'Unmapped character % entry key %', v_shape.collection, v_bad
        USING ERRCODE = '22023';
    END IF;
  END LOOP;

  SELECT e.key INTO v_bad FROM jsonb_each(
    CASE WHEN jsonb_typeof(p_document#>'{ancestry,mixedPhysical}') = 'object'
      THEN p_document#>'{ancestry,mixedPhysical}' ELSE '{}'::jsonb END
  ) e WHERE e.key <> ALL (ARRAY['aveHeight','aveWeight','adulthood','maxAge']) LIMIT 1;
  IF FOUND THEN RAISE EXCEPTION 'Unmapped mixedPhysical key %', v_bad
    USING ERRCODE = '22023'; END IF;
  SELECT e.key INTO v_bad FROM jsonb_each(
    CASE WHEN jsonb_typeof(p_document#>'{tempModifiers,abilities}') = 'object'
      THEN p_document#>'{tempModifiers,abilities}' ELSE '{}'::jsonb END
  ) e WHERE e.key <> ALL (ARRAY['strength','vitality','agility','acuity',
      'intelligence','charisma']) LIMIT 1;
  IF FOUND THEN RAISE EXCEPTION 'Unmapped temp ability %', v_bad
    USING ERRCODE = '22023'; END IF;
  SELECT e.key INTO v_bad FROM jsonb_each(
    CASE WHEN jsonb_typeof(p_document#>'{tempModifiers,defenses}') = 'object'
      THEN p_document#>'{tempModifiers,defenses}' ELSE '{}'::jsonb END
  ) e WHERE e.key <> ALL (ARRAY['might','fortitude','reflex','discernment',
      'mentalFortitude','resolve']) LIMIT 1;
  IF FOUND THEN RAISE EXCEPTION 'Unmapped temp defense %', v_bad
    USING ERRCODE = '22023'; END IF;
END;
$fn$;

REVOKE ALL ON FUNCTION public.assert_character_document_mapped(jsonb) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.assert_character_document_mapped(jsonb)
  FROM authenticated, service_role;

-- Replaces every child projection of a complete legacy document. Invoked by
-- the compatibility trigger only after all child mappings are installed.
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
BEGIN
  SELECT user_id INTO v_owner_id FROM public.characters WHERE id = p_character_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Character % not found', p_character_id USING ERRCODE = 'P0002';
  END IF;
  IF jsonb_typeof(p_document) IS DISTINCT FROM 'object' THEN
    RAISE EXCEPTION 'Character data must be an object' USING ERRCODE = '22023';
  END IF;
  PERFORM public.assert_character_document_mapped(p_document);

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
  DELETE FROM public.character_inventory WHERE character_id = p_character_id;
  DELETE FROM public.character_conditions WHERE character_id = p_character_id;
  DELETE FROM public.character_named_notes WHERE character_id = p_character_id;
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
      character_id, position, note_id, name, content
    ) VALUES (
      p_character_id, v_entry.ordinality, v_entry.value->>'id',
      v_entry.value->>'name', coalesce(v_entry.value->>'content','')
    );
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

REVOKE ALL ON FUNCTION public.sync_character_child_tables(text,jsonb) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.sync_character_child_tables(text,jsonb)
  FROM authenticated, service_role;

CREATE OR REPLACE FUNCTION public.sync_character_data_compat_trigger()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER
SET search_path = pg_catalog, public AS $fn$
DECLARE v_previous_flag text;
BEGIN
  v_previous_flag := current_setting('app.character_compat_sync', true);
  PERFORM set_config('app.character_compat_sync','on',true);
  PERFORM public.sync_character_scalar_columns(NEW.id, NEW.data);
  PERFORM public.sync_character_child_tables(NEW.id, NEW.data);
  PERFORM set_config('app.character_compat_sync',coalesce(v_previous_flag,''),true);
  RETURN NEW;
END;
$fn$;

DROP TRIGGER IF EXISTS sync_character_data_compat ON public.characters;
CREATE TRIGGER sync_character_data_compat
AFTER INSERT OR UPDATE OF data ON public.characters
FOR EACH ROW EXECUTE FUNCTION public.sync_character_data_compat_trigger();

-- Backfill every pre-existing row under the same DDL transaction. A failure
-- rolls the entire expand migration back. Calling the projection twice has
-- the same result; no old character is silently skipped.
DO $backfill$
DECLARE r record;
        previous_flag text;
BEGIN
  previous_flag := current_setting('app.character_compat_sync', true);
  PERFORM set_config('app.character_compat_sync','on',true);
  FOR r IN SELECT id, data FROM public.characters ORDER BY id FOR UPDATE LOOP
    PERFORM public.sync_character_scalar_columns(r.id, r.data);
    PERFORM public.sync_character_child_tables(r.id, r.data);
  END LOOP;
  PERFORM set_config('app.character_compat_sync',coalesce(previous_flag,''),true);
END;
$backfill$;

-- Direct child writes made by the relational RPCs invalidate parent realtime
-- subscriptions and advance the optimistic lock. Compatibility projection
-- writes are exempt: the original document write already touched the parent.
CREATE OR REPLACE FUNCTION public.touch_character_from_child()
RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path = public AS $fn$
DECLARE v_character_id text;
BEGIN
  IF current_setting('app.character_compat_sync', true) = 'on' THEN
    RETURN coalesce(NEW, OLD);
  END IF;
  v_character_id := coalesce(NEW.character_id, OLD.character_id);
  UPDATE public.characters c
  SET updated_at = greatest(
    clock_timestamp() AT TIME ZONE 'UTC',
    coalesce(c.updated_at, clock_timestamp() AT TIME ZONE 'UTC')
      + interval '1 millisecond'
  )
  WHERE c.id = v_character_id;
  RETURN coalesce(NEW, OLD);
END;
$fn$;

DO $touch_triggers$
DECLARE child text;
BEGIN
  FOREACH child IN ARRAY ARRAY[
    'character_species','character_feats','character_skills','character_traits',
    'character_powers','character_techniques','character_inventory',
    'character_conditions','character_named_notes','character_archetype_choices',
    'character_proficiencies','character_temp_modifiers',
    'character_affiliations','character_ability_components'
  ] LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS touch_character_parent ON public.%I', child);
    EXECUTE format('CREATE TRIGGER touch_character_parent AFTER INSERT OR UPDATE OR DELETE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.touch_character_from_child()', child);
  END LOOP;
END;
$touch_triggers$;

COMMIT;
