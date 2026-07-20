-- APPLIED 2026-07-20 on RealmsRPG-Test (lbqhiwudvifmkjtkccdg) — owner approved.
-- Purpose: Align saved techniques with attack-mode rework (TASK-507):
--   1) Zero option levels on Add Weapon mechanic parts (flat base cost only)
--   2) Strip tied payload.weapon objects / ids
--   3) Rewrite weapon_name column to Attack labels (No Attack / Unarmed / Weapon)
--   4) Persist payload.attackMode derived from parts
--
-- NOTE: Keep weapon_name column — app already uses it for Attack labels
-- (see library-columnar.ts DESIGN_INTENT), not specific weapon names.
-- Dropping the column would break columnar reads/writes; renaming is out of scope.
--
-- Pre-apply audit:
--   official_techniques: 9 Add Weapon rows with op_1_lvl 7–11; 4 payload.weapon; 4 legacy weapon_name
--   user_techniques: 26 Add Weapon rows with op_1_lvl 5–13; 15 payload.weapon; 15 legacy weapon_name
--   powers / characters / creatures: no Add Weapon option-level debt

BEGIN;

-- ---------------------------------------------------------------------------
-- Helper expression notes (inlined in UPDATEs):
--   attack_mode: none | unarmed | weapon  (technique rules)
--   weapon_name: No Attack | Unarmed | Weapon
-- ---------------------------------------------------------------------------

UPDATE official_techniques
SET
  payload = (
    SELECT
      (
        (payload - 'weapon' - 'addWeapon')
        || jsonb_build_object(
          'attackMode',
          CASE
            WHEN EXISTS (
              SELECT 1
              FROM jsonb_array_elements(COALESCE(cleaned_parts, '[]'::jsonb)) x
              WHERE (x->>'id') = '415' OR lower(COALESCE(x->>'name', '')) = 'no attack'
            ) THEN 'none'
            WHEN EXISTS (
              SELECT 1
              FROM jsonb_array_elements(COALESCE(cleaned_parts, '[]'::jsonb)) x
              WHERE (x->>'id') IN ('7', '369')
                OR lower(COALESCE(x->>'name', '')) IN (
                  'add weapon to technique',
                  'add weapon to power',
                  'add weapon attack'
                )
            ) THEN 'weapon'
            ELSE 'unarmed'
          END,
          'parts',
          COALESCE(cleaned_parts, '[]'::jsonb)
        )
      )
    FROM (
      SELECT jsonb_agg(
        CASE
          WHEN (elem->>'id') IN ('7', '369')
            OR lower(COALESCE(elem->>'name', '')) IN (
              'add weapon to technique',
              'add weapon to power',
              'add weapon attack'
            )
          THEN (
            elem
            || jsonb_build_object('op_1_lvl', 0, 'op_2_lvl', 0, 'op_3_lvl', 0)
          )
            - 'opt1Level' - 'opt2Level' - 'opt3Level'
          ELSE elem
        END
        ORDER BY ord
      ) AS cleaned_parts
      FROM jsonb_array_elements(COALESCE(payload->'parts', '[]'::jsonb))
        WITH ORDINALITY AS t(elem, ord)
    ) parts_sub
  ),
  weapon_name = CASE
    WHEN EXISTS (
      SELECT 1
      FROM jsonb_array_elements(COALESCE(payload->'parts', '[]'::jsonb)) x
      WHERE (x->>'id') = '415' OR lower(COALESCE(x->>'name', '')) = 'no attack'
    ) THEN 'No Attack'
    WHEN EXISTS (
      SELECT 1
      FROM jsonb_array_elements(COALESCE(payload->'parts', '[]'::jsonb)) x
      WHERE (x->>'id') IN ('7', '369')
        OR lower(COALESCE(x->>'name', '')) IN (
          'add weapon to technique',
          'add weapon to power',
          'add weapon attack'
        )
    ) THEN 'Weapon'
    ELSE 'Unarmed'
  END,
  updated_at = now();

UPDATE user_techniques
SET
  payload = (
    SELECT
      (
        (payload - 'weapon' - 'addWeapon')
        || jsonb_build_object(
          'attackMode',
          CASE
            WHEN EXISTS (
              SELECT 1
              FROM jsonb_array_elements(COALESCE(cleaned_parts, '[]'::jsonb)) x
              WHERE (x->>'id') = '415' OR lower(COALESCE(x->>'name', '')) = 'no attack'
            ) THEN 'none'
            WHEN EXISTS (
              SELECT 1
              FROM jsonb_array_elements(COALESCE(cleaned_parts, '[]'::jsonb)) x
              WHERE (x->>'id') IN ('7', '369')
                OR lower(COALESCE(x->>'name', '')) IN (
                  'add weapon to technique',
                  'add weapon to power',
                  'add weapon attack'
                )
            ) THEN 'weapon'
            ELSE 'unarmed'
          END,
          'parts',
          COALESCE(cleaned_parts, '[]'::jsonb)
        )
      )
    FROM (
      SELECT jsonb_agg(
        CASE
          WHEN (elem->>'id') IN ('7', '369')
            OR lower(COALESCE(elem->>'name', '')) IN (
              'add weapon to technique',
              'add weapon to power',
              'add weapon attack'
            )
          THEN (
            elem
            || jsonb_build_object('op_1_lvl', 0, 'op_2_lvl', 0, 'op_3_lvl', 0)
          )
            - 'opt1Level' - 'opt2Level' - 'opt3Level'
          ELSE elem
        END
        ORDER BY ord
      ) AS cleaned_parts
      FROM jsonb_array_elements(COALESCE(payload->'parts', '[]'::jsonb))
        WITH ORDINALITY AS t(elem, ord)
    ) parts_sub
  ),
  weapon_name = CASE
    WHEN EXISTS (
      SELECT 1
      FROM jsonb_array_elements(COALESCE(payload->'parts', '[]'::jsonb)) x
      WHERE (x->>'id') = '415' OR lower(COALESCE(x->>'name', '')) = 'no attack'
    ) THEN 'No Attack'
    WHEN EXISTS (
      SELECT 1
      FROM jsonb_array_elements(COALESCE(payload->'parts', '[]'::jsonb)) x
      WHERE (x->>'id') IN ('7', '369')
        OR lower(COALESCE(x->>'name', '')) IN (
          'add weapon to technique',
          'add weapon to power',
          'add weapon attack'
        )
    ) THEN 'Weapon'
    ELSE 'Unarmed'
  END,
  updated_at = now();

-- Empowered techniques: strip nested power.addWeapon / addWeaponPowerPart weapon ties;
-- zero option levels on any Add Weapon parts in payload.parts or power.parts.
UPDATE user_empowered_techniques
SET
  payload = (
    SELECT
      (
        (payload - 'weapon' - 'addWeapon')
        || CASE
          WHEN jsonb_typeof(payload->'power') = 'object' THEN
            jsonb_build_object(
              'power',
              (
                (payload->'power') - 'addWeapon' - 'addWeaponPowerPart' - 'weapon'
              )
            )
          ELSE '{}'::jsonb
        END
        || jsonb_build_object(
          'parts',
          COALESCE(cleaned_parts, COALESCE(payload->'parts', '[]'::jsonb))
        )
      )
    FROM (
      SELECT jsonb_agg(
        CASE
          WHEN (elem->>'id') IN ('7', '369')
            OR lower(COALESCE(elem->>'name', '')) IN (
              'add weapon to technique',
              'add weapon to power',
              'add weapon attack'
            )
          THEN (
            elem
            || jsonb_build_object('op_1_lvl', 0, 'op_2_lvl', 0, 'op_3_lvl', 0)
          )
            - 'opt1Level' - 'opt2Level' - 'opt3Level'
          ELSE elem
        END
        ORDER BY ord
      ) AS cleaned_parts
      FROM jsonb_array_elements(COALESCE(payload->'parts', '[]'::jsonb))
        WITH ORDINALITY AS t(elem, ord)
    ) parts_sub
  ),
  updated_at = now()
WHERE
  payload ? 'weapon'
  OR payload ? 'addWeapon'
  OR (
    jsonb_typeof(payload->'power') = 'object'
    AND (
      (payload->'power') ? 'addWeapon'
      OR (payload->'power') ? 'addWeaponPowerPart'
      OR (payload->'power') ? 'weapon'
    )
  )
  OR EXISTS (
    SELECT 1
    FROM jsonb_array_elements(COALESCE(payload->'parts', '[]'::jsonb)) p
    WHERE (
        (p->>'id') IN ('7', '369')
        OR lower(COALESCE(p->>'name', '')) IN (
          'add weapon to technique',
          'add weapon to power',
          'add weapon attack'
        )
      )
      AND (
        COALESCE((p->>'op_1_lvl')::numeric, 0) > 0
        OR COALESCE((p->>'op_2_lvl')::numeric, 0) > 0
        OR COALESCE((p->>'op_3_lvl')::numeric, 0) > 0
      )
  );

UPDATE official_empowered_techniques
SET
  payload = (
    SELECT
      (
        (payload - 'weapon' - 'addWeapon')
        || CASE
          WHEN jsonb_typeof(payload->'power') = 'object' THEN
            jsonb_build_object(
              'power',
              (
                (payload->'power') - 'addWeapon' - 'addWeaponPowerPart' - 'weapon'
              )
            )
          ELSE '{}'::jsonb
        END
        || jsonb_build_object(
          'parts',
          COALESCE(cleaned_parts, COALESCE(payload->'parts', '[]'::jsonb))
        )
      )
    FROM (
      SELECT jsonb_agg(
        CASE
          WHEN (elem->>'id') IN ('7', '369')
            OR lower(COALESCE(elem->>'name', '')) IN (
              'add weapon to technique',
              'add weapon to power',
              'add weapon attack'
            )
          THEN (
            elem
            || jsonb_build_object('op_1_lvl', 0, 'op_2_lvl', 0, 'op_3_lvl', 0)
          )
            - 'opt1Level' - 'opt2Level' - 'opt3Level'
          ELSE elem
        END
        ORDER BY ord
      ) AS cleaned_parts
      FROM jsonb_array_elements(COALESCE(payload->'parts', '[]'::jsonb))
        WITH ORDINALITY AS t(elem, ord)
    ) parts_sub
  ),
  updated_at = now()
WHERE
  payload ? 'weapon'
  OR payload ? 'addWeapon'
  OR (
    jsonb_typeof(payload->'power') = 'object'
    AND (
      (payload->'power') ? 'addWeapon'
      OR (payload->'power') ? 'addWeaponPowerPart'
      OR (payload->'power') ? 'weapon'
    )
  );

COMMIT;

-- ---------------------------------------------------------------------------
-- VERIFICATION
-- ---------------------------------------------------------------------------
-- Expect: with_option_levels = 0; with_weapon_obj = 0;
--         weapon_name only in ('No Attack','Unarmed','Weapon')
--
-- WITH weapon_parts AS (
--   SELECT 'official_techniques' AS src, p
--   FROM official_techniques,
--     LATERAL jsonb_array_elements(COALESCE(payload->'parts', '[]'::jsonb)) p
--   WHERE (p->>'id') IN ('7', '369')
--      OR lower(COALESCE(p->>'name', '')) IN (
--           'add weapon to technique', 'add weapon to power', 'add weapon attack'
--         )
--   UNION ALL
--   SELECT 'user_techniques', p
--   FROM user_techniques,
--     LATERAL jsonb_array_elements(COALESCE(payload->'parts', '[]'::jsonb)) p
--   WHERE (p->>'id') IN ('7', '369')
--      OR lower(COALESCE(p->>'name', '')) IN (
--           'add weapon to technique', 'add weapon to power', 'add weapon attack'
--         )
-- )
-- SELECT src,
--   count(*) AS total_with_add_weapon,
--   count(*) FILTER (
--     WHERE COALESCE((p->>'op_1_lvl')::numeric, 0) > 0
--        OR COALESCE((p->>'op_2_lvl')::numeric, 0) > 0
--        OR COALESCE((p->>'op_3_lvl')::numeric, 0) > 0
--   ) AS with_option_levels
-- FROM weapon_parts
-- GROUP BY src;
--
-- SELECT 'official' AS src,
--   count(*) FILTER (WHERE payload ? 'weapon' AND payload->'weapon' IS NOT NULL AND payload->'weapon' != 'null'::jsonb) AS with_weapon_obj,
--   count(*) FILTER (WHERE weapon_name IS NULL OR weapon_name NOT IN ('No Attack','Unarmed','Weapon')) AS bad_weapon_name
-- FROM official_techniques
-- UNION ALL
-- SELECT 'user',
--   count(*) FILTER (WHERE payload ? 'weapon' AND payload->'weapon' IS NOT NULL AND payload->'weapon' != 'null'::jsonb),
--   count(*) FILTER (WHERE weapon_name IS NULL OR weapon_name NOT IN ('No Attack','Unarmed','Weapon'))
-- FROM user_techniques;
--
-- SELECT weapon_name, count(*) FROM official_techniques GROUP BY 1
-- UNION ALL SELECT weapon_name, count(*) FROM user_techniques GROUP BY 1;
