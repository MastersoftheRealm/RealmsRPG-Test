-- Read-only preflight for ADR-0030. Run on the same database immediately before
-- expand and contract. Every result set is deliberately bounded to aggregates or
-- identifiers; no portrait URLs, notes, backstories, or private library payloads.

-- 1. Key inventory. Any unclassified key blocks the contract migration.
WITH keys AS (
  SELECT c.id, e.key, jsonb_typeof(e.value) AS value_type
  FROM public.characters c
  CROSS JOIN LATERAL jsonb_each(
    CASE WHEN jsonb_typeof(c.data) = 'object' THEN c.data ELSE '{}'::jsonb END
  ) e
), known AS (
  SELECT unnest(ARRAY[
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
    'organizations','conditions','speedDisplayUnit','libraryTabVisibility','tempModifiers',
    'ancestry','species','ancestryTraits','flawTrait','characteristicTrait',
    'speciesTraits','health_energy_points','creationMode','allTraits',
    '_displayFeats','defenses','defenseBonuses','speed','evasion','armor'
  ]) AS key
)
SELECT k.key, k.value_type, count(*) AS characters,
       (known.key IS NULL) AS unclassified
FROM keys k LEFT JOIN known USING (key)
GROUP BY k.key, k.value_type, known.key
ORDER BY unclassified DESC, k.key, k.value_type;

-- 2. Existing authoritative list columns versus copied document values.
SELECT c.id,
       array_remove(ARRAY[
         CASE WHEN c.data ? 'name' AND c.name IS DISTINCT FROM c.data->>'name'
           THEN 'name' END,
         CASE WHEN c.data ? 'level' AND c.level IS DISTINCT FROM
           CASE WHEN (c.data->>'level') ~ '^[0-9]+$'
             THEN (c.data->>'level')::integer END THEN 'level' END,
         CASE WHEN c.data ? 'status' AND c.status IS DISTINCT FROM c.data->>'status'
           THEN 'status' END,
         CASE WHEN c.data ? 'visibility' AND c.visibility IS DISTINCT FROM c.data->>'visibility'
           THEN 'visibility' END
       ], NULL) AS conflicting_columns
FROM public.characters c
WHERE (c.data ? 'name' AND c.name IS DISTINCT FROM c.data->>'name')
   OR (c.data ? 'level' AND c.level IS DISTINCT FROM CASE WHEN (c.data->>'level') ~ '^[0-9]+$'
     THEN (c.data->>'level')::integer END
   ) OR (c.data ? 'status' AND c.status IS DISTINCT FROM c.data->>'status')
   OR (c.data ? 'visibility' AND c.visibility IS DISTINCT FROM c.data->>'visibility')
ORDER BY c.id;

-- 3. Malformed top-level collections and objects.
WITH expected(key, value_type) AS (VALUES
  ('feats','array'),('archetypeFeats','array'),('skills','array'),
  ('powers','array'),('techniques','array'),('traits','array'),
  ('conditions','array'),('proficiencies','array'),('namedNotes','array'),
  ('abilities','object'),('defenseVals','object'),('ancestry','object'),
  ('archetype','object'),('equipment','object'),('tempModifiers','object'),
  ('archetypeChoices','object'),('traitUses','object'),
  ('traitCustomizations','object'),('libraryTabVisibility','object')
)
SELECT c.id, e.key, e.value_type AS expected_type,
       jsonb_typeof(c.data->e.key) AS actual_type
FROM public.characters c CROSS JOIN expected e
WHERE c.data ? e.key AND c.data->e.key <> 'null'::jsonb
  AND jsonb_typeof(c.data->e.key) <> e.value_type
  AND NOT (e.key = 'skills' AND jsonb_typeof(c.data->e.key) = 'object')
ORDER BY c.id, e.key;

-- 3a. A document that is not an object cannot be migrated.
SELECT id, jsonb_typeof(data) AS actual_type
FROM public.characters
WHERE jsonb_typeof(data) IS DISTINCT FROM 'object'
ORDER BY id;

-- 3b. Duplicated identity/resource values. Scalar columns and canonical
-- currentHealth/currentEnergy win; differences still need to be visible.
SELECT id,
       array_remove(ARRAY[
         CASE WHEN data ? 'id' AND data->>'id' IS DISTINCT FROM id THEN 'id' END,
         CASE WHEN data ? 'userId' AND data->>'userId' IS DISTINCT FROM user_id
           THEN 'userId' END,
         CASE WHEN data ? 'currentHealth' AND data#>>'{health,current}' IS NOT NULL
                   AND data->>'currentHealth' IS DISTINCT FROM data#>>'{health,current}'
           THEN 'health.current' END,
         CASE WHEN data ? 'currentEnergy' AND data#>>'{energy,current}' IS NOT NULL
                   AND data->>'currentEnergy' IS DISTINCT FROM data#>>'{energy,current}'
           THEN 'energy.current' END,
         CASE WHEN data ? 'xp' AND data ? 'experience'
                   AND data->>'xp' IS DISTINCT FROM data->>'experience'
           THEN 'xp' END
       ], NULL) AS conflicting_values
FROM public.characters
WHERE (data ? 'id' AND data->>'id' IS DISTINCT FROM id)
   OR (data ? 'userId' AND data->>'userId' IS DISTINCT FROM user_id)
   OR (data ? 'currentHealth' AND data#>>'{health,current}' IS NOT NULL
       AND data->>'currentHealth' IS DISTINCT FROM data#>>'{health,current}')
   OR (data ? 'currentEnergy' AND data#>>'{energy,current}' IS NOT NULL
       AND data->>'currentEnergy' IS DISTINCT FROM data#>>'{energy,current}')
   OR (data ? 'xp' AND data ? 'experience' AND data->>'xp' IS DISTINCT FROM data->>'experience')
ORDER BY id;

-- 4. Duplicate collection references. Exact duplicates can use first entry;
-- different payloads for the same identifier require manual resolution.
WITH entries AS (
  SELECT c.id, field.key AS collection, x.ordinality,
         coalesce(nullif(x.value->>'id',''),nullif(x.value->>'name',''),
                  CASE WHEN jsonb_typeof(x.value) = 'string' THEN x.value #>> '{}' END)
           AS ref,
         x.value
  FROM public.characters c
  CROSS JOIN LATERAL (VALUES ('feats'),('archetypeFeats'),('powers'),
                             ('techniques'),('skills'),('proficiencies')) field(key)
  CROSS JOIN LATERAL jsonb_array_elements(
    CASE WHEN jsonb_typeof(c.data->field.key) = 'array'
      THEN c.data->field.key ELSE '[]'::jsonb END
  ) WITH ORDINALITY x(value, ordinality)
)
SELECT id, collection, ref, count(*) AS copies,
       count(DISTINCT value) AS distinct_payloads,
       array_agg(ordinality ORDER BY ordinality) AS positions
FROM entries WHERE ref IS NOT NULL
GROUP BY id, collection, ref HAVING count(*) > 1
ORDER BY distinct_payloads DESC, id, collection, ref;

-- 5. Reference resolution. Duplicate IDs across source tables are expected;
-- show which rows need source disambiguation or an unresolved snapshot.
WITH refs AS (
  SELECT c.id AS character_id, c.user_id, kind,
         coalesce(nullif(v->>'id',''), CASE WHEN jsonb_typeof(v) = 'string'
           THEN v #>> '{}' END) AS ref_id,
         nullif(v->>'name','') AS ref_name
  FROM public.characters c
  CROSS JOIN LATERAL (VALUES
    ('power', c.data->'powers'), ('technique', c.data->'techniques'),
    ('feat', c.data->'feats'), ('archetype_feat', c.data->'archetypeFeats')
  ) AS fields(kind, values)
  CROSS JOIN LATERAL jsonb_array_elements(
    CASE WHEN jsonb_typeof(fields.values) = 'array'
      THEN fields.values ELSE '[]'::jsonb END
  ) v
), candidates AS (
  SELECT r.*,
    CASE WHEN r.kind IN ('feat','archetype_feat') THEN
      (SELECT count(*) FROM public.codex_feats f WHERE f.id = r.ref_id
        OR (r.ref_id IS NULL AND lower(f.name) = lower(r.ref_name)))
    WHEN r.kind = 'power' THEN
      (SELECT count(*) FROM (
        SELECT id,name FROM public.official_powers UNION ALL
        SELECT id,name FROM public.user_powers u WHERE u.user_id = r.user_id
      ) x WHERE x.id = r.ref_id
        OR (r.ref_id IS NULL AND lower(x.name) = lower(r.ref_name)))
    ELSE
      (SELECT count(*) FROM (
        SELECT id,name FROM public.official_techniques UNION ALL
        SELECT id,name FROM public.official_empowered_techniques UNION ALL
        SELECT id,name FROM public.user_techniques u WHERE u.user_id = r.user_id UNION ALL
        SELECT id,name FROM public.user_empowered_techniques u WHERE u.user_id = r.user_id
      ) x WHERE x.id = r.ref_id
        OR (r.ref_id IS NULL AND lower(x.name) = lower(r.ref_name)))
    END AS matches
  FROM refs r
)
SELECT character_id, kind, ref_id, ref_name, matches
FROM candidates WHERE matches <> 1
ORDER BY character_id, kind, ref_id, ref_name;

-- 6. Unknown nested fields. A current saver writes lean references, but older
-- characters can still contain rich entries. Any row here needs an explicit
-- typed destination or a documented derivation before the column is dropped.
WITH shapes(collection, allowed_keys) AS (VALUES
  ('archetype', ARRAY['id','type','name','description']::text[]),
  ('ancestry', ARRAY['id','name','size','speed','selectedTraits','selectedFlaw',
    'selectedCharacteristic','mixed','speciesIds','speciesNames','selectedSize',
    'selectedSpeciesTraits','selectedFlawSpeciesId','mixedPhysical',
    'selectedSpeciesSkillIds','selectedSpeciesTraitChoices']::text[]),
  ('abilities', ARRAY['strength','vitality','agility','acuity','intelligence','charisma']::text[]),
  ('defenseVals', ARRAY['might','fortitude','reflex','discernment','mentalFortitude','resolve']::text[]),
  ('libraryTabVisibility', ARRAY['powers','techniques','inventory','feats',
    'proficiencies','notes']::text[]),
  ('tempModifiers', ARRAY['speed','evasion','damageReduction','criticalRange',
    'terminal','abilities','defenses','skills','applyAbilityToResourceMaxima']::text[]),
  ('equipment', ARRAY['mainHand','offHand','armor','weapons','shields','items',
    'accessories','inventory']::text[])
), fields AS (
  SELECT c.id, s.collection, e.key, s.allowed_keys
  FROM public.characters c CROSS JOIN shapes s
  CROSS JOIN LATERAL jsonb_each(
    CASE WHEN jsonb_typeof(c.data->s.collection) = 'object'
      THEN c.data->s.collection ELSE '{}'::jsonb END
  ) e
)
SELECT collection, key, count(*) AS characters, array_agg(id ORDER BY id) AS character_ids
FROM fields WHERE NOT key = ANY (allowed_keys)
GROUP BY collection, key ORDER BY collection, key;

-- 7. Non-lean collection entries. Current cleanForSave strips these fields,
-- but existing live rows may still hold them. This is intentionally a report,
-- never an implicit license to discard them.
WITH shapes(collection, allowed_keys) AS (VALUES
  ('feats', ARRAY['id','name','currentUses','customName','note']::text[]),
  ('archetypeFeats', ARRAY['id','name','currentUses','customName','note']::text[]),
  ('powers', ARRAY['id','name','innate','selectedVariantId']::text[]),
  ('techniques', ARRAY['id','name']::text[]),
  ('skills', ARRAY['id','name','skill_val','prof','selectedBaseSkillId','ability']::text[]),
  ('proficiencies', ARRAY['kind','id','refId','name','damageType','op1Level',
    'op2Level','op3Level','baseTP','op1TP','op2TP','op3TP','custom']::text[]),
  ('conditions', ARRAY['name','level','decaying','description']::text[]),
  ('namedNotes', ARRAY['id','name','content']::text[])
), fields AS (
  SELECT c.id, s.collection, x.ordinality AS position, e.key, s.allowed_keys
  FROM public.characters c CROSS JOIN shapes s
  CROSS JOIN LATERAL jsonb_array_elements(
    CASE WHEN jsonb_typeof(c.data->s.collection) = 'array'
      THEN c.data->s.collection ELSE '[]'::jsonb END
  ) WITH ORDINALITY x(value, ordinality)
  CROSS JOIN LATERAL jsonb_each(
    CASE WHEN jsonb_typeof(x.value) = 'object'
      THEN x.value ELSE '{}'::jsonb END
  ) e
)
SELECT collection, key, count(*) AS entries,
       array_agg(DISTINCT id ORDER BY id) AS character_ids
FROM fields WHERE NOT key = ANY (allowed_keys)
GROUP BY collection, key ORDER BY collection, key;

-- 8. Inventory collection shapes and unknown per-item keys. Quantity zero is
-- legal in the current saver, so it must remain representable in the schema.
WITH bins AS (
  SELECT c.id, x.key AS collection, x.value
  FROM public.characters c
  CROSS JOIN LATERAL jsonb_each(
    CASE WHEN jsonb_typeof(c.data->'equipment') = 'object'
      THEN c.data->'equipment' ELSE '{}'::jsonb END
  ) x
), entries AS (
  SELECT b.id, b.collection, v.ordinality AS position, v.value
  FROM bins b CROSS JOIN LATERAL jsonb_array_elements(
    CASE WHEN jsonb_typeof(b.value) = 'array' THEN b.value ELSE '[]'::jsonb END
  ) WITH ORDINALITY v(value, ordinality)
)
SELECT id, collection, position, jsonb_typeof(value) AS entry_type,
       (SELECT array_agg(k ORDER BY k) FROM jsonb_object_keys(
          CASE WHEN jsonb_typeof(value) = 'object' THEN value ELSE '{}'::jsonb END
        ) k WHERE k <> ALL (ARRAY['id','name','equipped','quantity','type','description']))
         AS unsupported_keys
FROM entries
WHERE jsonb_typeof(value) NOT IN ('object','string')
   OR EXISTS (SELECT 1 FROM jsonb_object_keys(
       CASE WHEN jsonb_typeof(value) = 'object' THEN value ELSE '{}'::jsonb END
     ) k WHERE k <> ALL (ARRAY['id','name','equipped','quantity','type','description']))
ORDER BY id, collection, position;

-- 9. Collection entry types that cannot be represented as a reference or a
-- typed row. These do not appear in the nested-key report above.
WITH fields(key, values, allow_string) AS (
  SELECT 'feats', data->'feats', true FROM public.characters UNION ALL
  SELECT 'archetypeFeats', data->'archetypeFeats', true FROM public.characters UNION ALL
  SELECT 'skills', data->'skills', true FROM public.characters UNION ALL
  SELECT 'powers', data->'powers', true FROM public.characters UNION ALL
  SELECT 'techniques', data->'techniques', true FROM public.characters UNION ALL
  SELECT 'traits', data->'traits', true FROM public.characters UNION ALL
  SELECT 'conditions', data->'conditions', false FROM public.characters UNION ALL
  SELECT 'namedNotes', data->'namedNotes', false FROM public.characters UNION ALL
  SELECT 'proficiencies', data->'proficiencies', false FROM public.characters
), bad AS (
  SELECT key, x.ordinality, jsonb_typeof(x.value) AS actual_type
  FROM fields f CROSS JOIN LATERAL jsonb_array_elements(
    CASE WHEN jsonb_typeof(f.values) = 'array' THEN f.values ELSE '[]'::jsonb END
  ) WITH ORDINALITY x(value, ordinality)
  WHERE jsonb_typeof(x.value) <> 'object'
    AND NOT (f.allow_string AND jsonb_typeof(x.value) = 'string')
)
SELECT key, actual_type, count(*) AS entries
FROM bad GROUP BY key, actual_type ORDER BY key, actual_type;

-- 10. Species and inventory source-resolution counts. Zero means an
-- unresolved snapshot; >1 is ambiguous and must be reviewed before backfill.
WITH species_refs AS (
  SELECT c.id AS character_id, c.user_id, s.ordinality AS slot,
         nullif(s.value #>> '{}','') AS ref_id,
         CASE WHEN c.data#>>'{ancestry,mixed}' = 'true'
           THEN nullif(c.data#>>ARRAY['ancestry','speciesNames',(s.ordinality - 1)::text],'')
           ELSE nullif(c.data#>>'{ancestry,name}','') END AS ref_name
  FROM public.characters c CROSS JOIN LATERAL jsonb_array_elements(
    CASE WHEN c.data#>>'{ancestry,mixed}' = 'true'
           AND jsonb_typeof(c.data#>'{ancestry,speciesIds}') = 'array'
      THEN c.data#>'{ancestry,speciesIds}'
      WHEN c.data#>>'{ancestry,id}' ~ '^mixed:[^+]+\+[^+]+$'
      THEN jsonb_build_array(
        split_part(split_part(c.data#>>'{ancestry,id}',':',2),'+',1),
        split_part(split_part(c.data#>>'{ancestry,id}',':',2),'+',2))
      ELSE jsonb_build_array(c.data#>'{ancestry,id}') END
  ) WITH ORDINALITY s(value, ordinality)
  WHERE jsonb_typeof(c.data->'ancestry') = 'object'
), inventory_refs AS (
  SELECT c.id AS character_id, c.user_id, bin.key AS collection,
         nullif(v.value->>'id','') AS ref_id,
         nullif(v.value->>'name','') AS ref_name
  FROM public.characters c CROSS JOIN LATERAL jsonb_each(
    CASE WHEN jsonb_typeof(c.data->'equipment') = 'object'
      THEN c.data->'equipment' ELSE '{}'::jsonb END
  ) bin CROSS JOIN LATERAL jsonb_array_elements(
    CASE WHEN jsonb_typeof(bin.value) = 'array' THEN bin.value ELSE '[]'::jsonb END
  ) v
), all_refs AS (
  SELECT character_id, user_id, 'species:' || slot::text AS kind, ref_id, ref_name
  FROM species_refs
  UNION ALL
  SELECT character_id, user_id, 'inventory:' || collection, ref_id, ref_name
  FROM inventory_refs
), candidates AS (
  SELECT r.*,
    CASE WHEN kind LIKE 'species:%' THEN
      (SELECT count(*) FROM (
        SELECT id, name FROM public.codex_species UNION ALL
        SELECT id, name FROM public.user_species u WHERE u.user_id = r.user_id
      ) s WHERE s.id = r.ref_id OR (r.ref_id IS NULL AND lower(s.name) = lower(r.ref_name)))
    ELSE
      (SELECT count(*) FROM (
        SELECT id, name FROM public.official_items UNION ALL
        SELECT id, name FROM public.codex_equipment UNION ALL
        SELECT id, name FROM public.user_items u WHERE u.user_id = r.user_id
      ) i WHERE i.id = r.ref_id OR (r.ref_id IS NULL AND lower(i.name) = lower(r.ref_name)))
    END AS matches
  FROM all_refs r
)
SELECT character_id, kind, ref_id, ref_name, matches
FROM candidates
WHERE matches <> 1 AND NOT (kind LIKE 'inventory:%' AND ref_id LIKE 'custom-%')
ORDER BY character_id, kind, ref_id, ref_name;

-- 11. Proficiency `id` is the character's generated row ID; `refId` is the
-- Codex part/property ID. A custom proficiency deliberately has no FK.
WITH refs AS (
  SELECT c.id AS character_id, p.value->>'kind' AS kind,
         p.value->>'refId' AS ref_id, p.value->>'name' AS ref_name
  FROM public.characters c CROSS JOIN LATERAL jsonb_array_elements(
    CASE WHEN jsonb_typeof(c.data->'proficiencies') = 'array'
      THEN c.data->'proficiencies' ELSE '[]'::jsonb END
  ) p
), counted AS (
  SELECT r.*,
    CASE WHEN kind IN ('power_part','technique_part') THEN
      (SELECT count(*) FROM public.codex_parts p WHERE p.id = r.ref_id
        OR (r.ref_id IS NULL AND lower(p.name) = lower(r.ref_name)))
    WHEN kind = 'item_property' THEN
      (SELECT count(*) FROM public.codex_properties p WHERE p.id = r.ref_id
        OR (r.ref_id IS NULL AND lower(p.name) = lower(r.ref_name)))
    ELSE 0 END AS matches
  FROM refs r
)
SELECT character_id, kind, ref_id, ref_name, matches
FROM counted WHERE kind <> 'custom' AND matches <> 1
ORDER BY character_id, kind, ref_id, ref_name;

-- 12. Redundant inventory copies and non-empty property arrays. The local
-- 2026-10-13 backup has one exact `inventory` = `items` duplicate and ten
-- empty property arrays; a future non-empty property list needs a child table.
SELECT id,
       data#>'{equipment,inventory}' = data#>'{equipment,items}' AS inventory_equals_items
FROM public.characters
WHERE data#>'{equipment,inventory}' IS NOT NULL
ORDER BY id;

SELECT c.id, bin.key AS collection, v.ordinality AS position,
       jsonb_typeof(v.value->'properties') AS properties_type
FROM public.characters c CROSS JOIN LATERAL jsonb_each(
  CASE WHEN jsonb_typeof(c.data->'equipment') = 'object'
    THEN c.data->'equipment' ELSE '{}'::jsonb END
) bin CROSS JOIN LATERAL jsonb_array_elements(
  CASE WHEN jsonb_typeof(bin.value) = 'array'
    THEN bin.value ELSE '[]'::jsonb END
) WITH ORDINALITY v(value, ordinality)
WHERE v.value ? 'properties'
  AND (jsonb_typeof(v.value->'properties') <> 'array'
    OR v.value->'properties' <> '[]'::jsonb)
ORDER BY c.id, bin.key, v.ordinality;
