-- APPLIED 2026-08-01 on RealmsRPG-Test (lbqhiwudvifmkjtkccdg) — owner approved (TASK-627).
-- Purpose: Remove auto-mechanic parts from official_powers.payload.parts that are already
--          represented by promoted columns (range_steps, duration_*, area_*, damage, action_type,
--          is_reaction) and optional payload.duration modifier flags.
-- Mirrors read-path rebuild in src/lib/calculators/mechanic-builder.ts + power-calc.ts.
--
-- Pre/post audit (44 official_powers total):
--   41 rows with ≥1 redundant auto-mechanic part in payload.parts (pre-apply)
--   Post-apply: overlap audit 0; 66 total parts remain across 44 rows
--   Menace: 5 → 3 parts (removed Duration (Minute), Sphere of Effect; kept No Harm…)
--   Fog Cloud: 6 → 3 parts (removed Power Range, Sphere of Effect, Duration (Minute); kept No Harm…)
--
-- Idempotent: re-run strips only names still present in payload.parts.

BEGIN;

-- ---------------------------------------------------------------------------
-- Helper: part names rebuilt from promoted columns / damage JSONB
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public._official_power_rebuilt_mechanic_part_names(
  p_is_reaction boolean,
  p_action_type text,
  p_range_steps integer,
  p_area_type text,
  p_duration_type text,
  p_payload_duration jsonb,
  p_damage jsonb
)
RETURNS text[]
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT array_remove(
    ARRAY[]::text[]
    || CASE WHEN COALESCE(p_is_reaction, false) THEN ARRAY['Power Reaction'] ELSE ARRAY[]::text[] END
    || CASE p_action_type
         WHEN 'quick' THEN ARRAY['Power Quick or Free Action']
         WHEN 'free' THEN ARRAY['Power Quick or Free Action']
         WHEN 'long3' THEN ARRAY['Power Long Action']
         WHEN 'long4' THEN ARRAY['Power Long Action']
         ELSE ARRAY[]::text[]
       END
    || CASE WHEN COALESCE(p_range_steps, 0) > 0 THEN ARRAY['Power Range'] ELSE ARRAY[]::text[] END
    || CASE p_area_type
         WHEN 'sphere' THEN ARRAY['Sphere of Effect']
         WHEN 'cylinder' THEN ARRAY['Cylinder of Effect']
         WHEN 'cone' THEN ARRAY['Cone of Effect']
         WHEN 'line' THEN ARRAY['Line of Effect']
         WHEN 'trail' THEN ARRAY['Trail of Effect']
         ELSE ARRAY[]::text[]
       END
    || CASE p_duration_type
         WHEN 'rounds' THEN ARRAY['Duration (Round)']
         WHEN 'minutes' THEN ARRAY['Duration (Minute)']
         WHEN 'hours' THEN ARRAY['Duration (Hour)']
         WHEN 'days' THEN ARRAY['Duration (Days)']
         WHEN 'permanent' THEN ARRAY['Duration (Permanent)']
         ELSE ARRAY[]::text[]
       END
    || CASE WHEN COALESCE((p_payload_duration->>'focus')::boolean, false)
         THEN ARRAY['Focus for Duration'] ELSE ARRAY[]::text[] END
    || CASE WHEN COALESCE((p_payload_duration->>'noHarm')::boolean, false)
         THEN ARRAY['No Harm or Adaptation for Duration'] ELSE ARRAY[]::text[] END
    || CASE WHEN COALESCE((p_payload_duration->>'endsOnActivation')::boolean, false)
         THEN ARRAY['Duration Ends On Activation'] ELSE ARRAY[]::text[] END
    || CASE WHEN COALESCE((p_payload_duration->>'sustain')::int, 0) > 0
         THEN ARRAY['Sustain for Duration'] ELSE ARRAY[]::text[] END
    || COALESCE(
         (
           SELECT array_agg(DISTINCT mapped.name)
           FROM jsonb_array_elements(COALESCE(p_damage, '[]'::jsonb)) AS d(elem)
           CROSS JOIN LATERAL (
             SELECT CASE lower(elem->>'type')
               WHEN 'fire' THEN 'Elemental Damage'
               WHEN 'cold' THEN 'Elemental Damage'
               WHEN 'ice' THEN 'Elemental Damage'
               WHEN 'lightning' THEN 'Elemental Damage'
               WHEN 'acid' THEN 'Elemental Damage'
               WHEN 'poison' THEN 'Poison or Necrotic Damage'
               WHEN 'necrotic' THEN 'Poison or Necrotic Damage'
               WHEN 'sonic' THEN 'Sonic Damage'
               WHEN 'spiritual' THEN 'Spiritual Damage'
               WHEN 'psychic' THEN 'Psychic Damage'
               WHEN 'physical' THEN 'Physical Damage'
               WHEN 'bludgeoning' THEN 'Physical Damage'
               WHEN 'piercing' THEN 'Physical Damage'
               WHEN 'slashing' THEN 'Physical Damage'
               WHEN 'magic' THEN 'Magic Damage'
               WHEN 'light' THEN 'Light Damage'
               ELSE NULL
             END AS name
           ) mapped
           WHERE mapped.name IS NOT NULL
             AND COALESCE(elem->>'type', 'none') <> 'none'
             AND COALESCE((elem->>'amount')::int, 0) > 0
             AND COALESCE((elem->>'size')::int, 0) >= 4
         ),
         ARRAY[]::text[]
       )
    || CASE
         WHEN COALESCE(
           (
             SELECT SUM(COALESCE((elem->>'amount')::int, 0))
             FROM jsonb_array_elements(COALESCE(p_damage, '[]'::jsonb)) AS d(elem)
             WHERE COALESCE(elem->>'type', 'none') <> 'none'
               AND COALESCE((elem->>'amount')::int, 0) > 0
               AND COALESCE((elem->>'size')::int, 0) >= 4
           ),
           0
         ) > 1
         AND COALESCE(
           (
             SELECT MAX(COALESCE((elem->>'size')::int, 0))
             FROM jsonb_array_elements(COALESCE(p_damage, '[]'::jsonb)) AS d(elem)
             WHERE COALESCE(elem->>'type', 'none') <> 'none'
               AND COALESCE((elem->>'amount')::int, 0) > 0
               AND COALESCE((elem->>'size')::int, 0) >= 4
           ),
           0
         ) >= 4
         THEN ARRAY['Power Split Damage Dice', 'Split Damage Dice']
         ELSE ARRAY[]::text[]
       END,
    NULL
  );
$$;

-- ---------------------------------------------------------------------------
-- Phase 1 — Audit (run before apply; safe to re-run)
-- ---------------------------------------------------------------------------
-- SELECT
--   p.id,
--   p.name,
--   jsonb_array_length(COALESCE(p.payload->'parts', '[]'::jsonb)) AS parts_before,
--   public._official_power_rebuilt_mechanic_part_names(
--     p.is_reaction, p.action_type, p.range_steps, p.area_type,
--     p.duration_type, p.payload->'duration', p.damage
--   ) AS strip_names,
--   COUNT(*) AS overlap_count
-- FROM public.official_powers p
-- CROSS JOIN LATERAL jsonb_array_elements(COALESCE(p.payload->'parts', '[]'::jsonb)) AS part(elem)
-- WHERE (part.elem->>'name') = ANY (
--   public._official_power_rebuilt_mechanic_part_names(
--     p.is_reaction, p.action_type, p.range_steps, p.area_type,
--     p.duration_type, p.payload->'duration', p.damage
--   )
-- )
-- GROUP BY p.id, p.name, p.payload, p.is_reaction, p.action_type, p.range_steps,
--          p.area_type, p.duration_type, p.damage
-- ORDER BY overlap_count DESC, p.name;

-- ---------------------------------------------------------------------------
-- Phase 2 — Preview Menace + Fog Cloud (before/after part names)
-- ---------------------------------------------------------------------------
-- SELECT
--   p.name,
--   'before' AS phase,
--   COALESCE(
--     (SELECT array_agg(elem->>'name' ORDER BY ord)
--      FROM jsonb_array_elements(COALESCE(p.payload->'parts', '[]'::jsonb)) WITH ORDINALITY AS t(elem, ord)),
--     ARRAY[]::text[]
--   ) AS part_names
-- FROM public.official_powers p
-- WHERE p.name IN ('Menace', 'Fog Cloud')
-- UNION ALL
-- SELECT
--   p.name,
--   'after' AS phase,
--   COALESCE(
--     (SELECT array_agg(elem->>'name' ORDER BY ord)
--      FROM jsonb_array_elements(
--        COALESCE(
--          (
--            SELECT jsonb_agg(elem ORDER BY ord)
--            FROM jsonb_array_elements(COALESCE(p.payload->'parts', '[]'::jsonb)) WITH ORDINALITY AS t(elem, ord)
--            WHERE NOT (
--              (elem->>'name') = ANY (
--                public._official_power_rebuilt_mechanic_part_names(
--                  p.is_reaction, p.action_type, p.range_steps, p.area_type,
--                  p.duration_type, p.payload->'duration', p.damage
--                )
--              )
--            )
--          ),
--          '[]'::jsonb
--        )
--      ) WITH ORDINALITY AS t2(elem, ord)),
--     ARRAY[]::text[]
--   ) AS part_names
-- FROM public.official_powers p
-- WHERE p.name IN ('Menace', 'Fog Cloud')
-- ORDER BY name, phase;

-- ---------------------------------------------------------------------------
-- Phase 3 — Apply: strip redundant parts from payload.parts
-- ---------------------------------------------------------------------------
UPDATE public.official_powers p
SET
  payload = jsonb_set(
    COALESCE(p.payload, '{}'::jsonb),
    '{parts}',
    COALESCE(
      (
        SELECT jsonb_agg(elem ORDER BY ord)
        FROM jsonb_array_elements(COALESCE(p.payload->'parts', '[]'::jsonb)) WITH ORDINALITY AS t(elem, ord)
        WHERE NOT (
          (elem->>'name') = ANY (
            public._official_power_rebuilt_mechanic_part_names(
              p.is_reaction,
              p.action_type,
              p.range_steps,
              p.area_type,
              p.duration_type,
              p.payload->'duration',
              p.damage
            )
          )
        )
      ),
      '[]'::jsonb
    ),
    true
  ),
  updated_at = now()
WHERE EXISTS (
  SELECT 1
  FROM jsonb_array_elements(COALESCE(p.payload->'parts', '[]'::jsonb)) AS part(elem)
  WHERE (part.elem->>'name') = ANY (
    public._official_power_rebuilt_mechanic_part_names(
      p.is_reaction,
      p.action_type,
      p.range_steps,
      p.area_type,
      p.duration_type,
      p.payload->'duration',
      p.damage
    )
  )
);

COMMIT;

-- Post-apply verification:
-- SELECT COUNT(*) FROM official_powers;  -- 44
-- SELECT COUNT(*) FROM (
--   SELECT p.id
--   FROM official_powers p
--   CROSS JOIN LATERAL jsonb_array_elements(COALESCE(p.payload->'parts','[]'::jsonb)) part(elem)
--   WHERE (part.elem->>'name') = ANY (
--     public._official_power_rebuilt_mechanic_part_names(
--       p.is_reaction, p.action_type, p.range_steps, p.area_type,
--       p.duration_type, p.payload->'duration', p.damage
--     )
--   )
--   GROUP BY p.id
-- ) x;  -- expect 0
