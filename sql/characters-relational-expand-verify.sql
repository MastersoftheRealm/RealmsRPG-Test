-- ADR-0030 expand verification. Read-only; run after expand and after every
-- compatibility-release smoke test. A mismatch row, or a nonzero orphan count,
-- is a backfill/sync failure.
-- This is a count/identity gate, not the final semantic parity gate: the
-- contract phase also needs assembled-document comparison and owner QA.

WITH character_references AS (
  SELECT c.id, field.key,
         coalesce(nullif(x.value->>'id',''),nullif(x.value->>'name',''),
           CASE WHEN jsonb_typeof(x.value) = 'string' THEN x.value #>> '{}' END)
           AS reference
  FROM public.characters c
  CROSS JOIN LATERAL (VALUES
    ('feats',c.data->'feats'),
    ('archetypeFeats',c.data->'archetypeFeats'),
    ('powers',c.data->'powers'),
    ('techniques',c.data->'techniques'),
    ('skills',CASE WHEN jsonb_typeof(c.data->'skills') = 'object'
      THEN (SELECT coalesce(jsonb_agg(jsonb_build_object('id',e.key)),'[]'::jsonb)
            FROM jsonb_each(c.data->'skills') e)
      ELSE c.data->'skills' END),
    ('proficiencies',c.data->'proficiencies')
  ) field(key, entries)
  CROSS JOIN LATERAL jsonb_array_elements(
    CASE WHEN jsonb_typeof(field.entries) = 'array'
      THEN field.entries ELSE '[]'::jsonb END
  ) x
), ref_counts AS (
  SELECT id, key, count(DISTINCT reference) AS entries
  FROM character_references GROUP BY id, key
), expected AS (
  SELECT c.id,
    coalesce((SELECT entries FROM ref_counts r WHERE r.id=c.id AND key='feats'),0) AS feats,
    coalesce((SELECT entries FROM ref_counts r WHERE r.id=c.id AND key='archetypeFeats'),0)
      AS archetype_feats,
    coalesce((SELECT entries FROM ref_counts r WHERE r.id=c.id AND key='powers'),0) AS powers,
    coalesce((SELECT entries FROM ref_counts r WHERE r.id=c.id AND key='techniques'),0)
      AS techniques,
    coalesce((SELECT entries FROM ref_counts r WHERE r.id=c.id AND key='skills'),0) AS skills,
    jsonb_array_length(CASE WHEN jsonb_typeof(c.data->'conditions') = 'array'
      THEN c.data->'conditions' ELSE '[]'::jsonb END) AS conditions,
    jsonb_array_length(CASE WHEN jsonb_typeof(c.data->'namedNotes') = 'array'
      THEN c.data->'namedNotes' ELSE '[]'::jsonb END) AS named_notes,
    coalesce((SELECT entries FROM ref_counts r WHERE r.id=c.id AND key='proficiencies'),0)
      AS proficiencies
  FROM public.characters c
), actual AS (
  SELECT e.id, e.feats, e.archetype_feats, e.powers, e.techniques,
         e.skills, e.conditions, e.named_notes, e.proficiencies,
    (SELECT count(*) FROM public.character_feats f
      WHERE f.character_id = e.id AND f.feat_kind = 'character') AS stored_feats,
    (SELECT count(*) FROM public.character_feats f
      WHERE f.character_id = e.id AND f.feat_kind = 'archetype') AS stored_archetype_feats,
    (SELECT count(*) FROM public.character_powers p
      WHERE p.character_id = e.id) AS stored_powers,
    (SELECT count(*) FROM public.character_techniques t
      WHERE t.character_id = e.id) AS stored_techniques,
    (SELECT count(*) FROM public.character_skills s
      WHERE s.character_id = e.id AND s.selection_present) AS stored_skills,
    (SELECT count(*) FROM public.character_conditions x
      WHERE x.character_id = e.id) AS stored_conditions,
    (SELECT count(*) FROM public.character_named_notes n
      WHERE n.character_id = e.id) AS stored_named_notes,
    (SELECT count(*) FROM public.character_proficiencies p
      WHERE p.character_id = e.id) AS stored_proficiencies
  FROM expected e
)
SELECT id,
  array_remove(ARRAY[
    CASE WHEN feats <> stored_feats THEN 'feats' END,
    CASE WHEN archetype_feats <> stored_archetype_feats THEN 'archetypeFeats' END,
    CASE WHEN powers <> stored_powers THEN 'powers' END,
    CASE WHEN techniques <> stored_techniques THEN 'techniques' END,
    CASE WHEN skills <> stored_skills THEN 'skills' END,
    CASE WHEN conditions <> stored_conditions THEN 'conditions' END,
    CASE WHEN named_notes <> stored_named_notes THEN 'namedNotes' END,
    CASE WHEN proficiencies <> stored_proficiencies THEN 'proficiencies' END
  ], NULL) AS mismatched_collections
FROM actual
WHERE feats <> stored_feats OR archetype_feats <> stored_archetype_feats
   OR powers <> stored_powers OR techniques <> stored_techniques
   OR skills <> stored_skills OR conditions <> stored_conditions
   OR named_notes <> stored_named_notes OR proficiencies <> stored_proficiencies
ORDER BY id;

-- Canonical scalar values. `experience` wins over the legacy `xp` alias;
-- `currentHealth`/`currentEnergy` win over resource-pool copies.
SELECT id,
  array_remove(ARRAY[
    CASE WHEN experience IS DISTINCT FROM coalesce(
      nullif(data->>'experience',''),nullif(data->>'xp',''))::integer
      THEN 'experience' END,
    CASE WHEN current_health IS DISTINCT FROM coalesce(
      nullif(data->>'currentHealth',''),nullif(data#>>'{health,current}',''))::integer
      THEN 'currentHealth' END,
    CASE WHEN current_energy IS DISTINCT FROM coalesce(
      nullif(data->>'currentEnergy',''),nullif(data#>>'{energy,current}',''))::integer
      THEN 'currentEnergy' END,
    CASE WHEN portrait IS DISTINCT FROM coalesce(
      data->>'portrait',data->>'portraitUrl',data->>'portrait_url')
      THEN 'portrait' END
  ], NULL) AS mismatched_scalars
FROM public.characters
WHERE experience IS DISTINCT FROM coalesce(
      nullif(data->>'experience',''),nullif(data->>'xp',''))::integer
   OR current_health IS DISTINCT FROM coalesce(
      nullif(data->>'currentHealth',''),nullif(data#>>'{health,current}',''))::integer
   OR current_energy IS DISTINCT FROM coalesce(
      nullif(data->>'currentEnergy',''),nullif(data#>>'{energy,current}',''))::integer
   OR portrait IS DISTINCT FROM coalesce(
      data->>'portrait',data->>'portraitUrl',data->>'portrait_url')
ORDER BY id;

-- Every live child must have a parent (the FK should make this impossible).
SELECT 'character_species' AS child, count(*) AS orphans FROM public.character_species s
  WHERE NOT EXISTS (SELECT 1 FROM public.characters c WHERE c.id = s.character_id)
UNION ALL
SELECT 'character_feats', count(*) FROM public.character_feats f
  WHERE NOT EXISTS (SELECT 1 FROM public.characters c WHERE c.id = f.character_id)
UNION ALL
SELECT 'character_inventory', count(*) FROM public.character_inventory i
  WHERE NOT EXISTS (SELECT 1 FROM public.characters c WHERE c.id = i.character_id);
