-- APPLIED 2026-07-15 on RealmsRPG-Test (lbqhiwudvifmkjtkccdg) — owner approved.
-- Purpose: Remove guided quick-kit payloads from codex_archetypes.level1_loadouts.
-- Kit item ids for Berserker were already present in level1_armaments / level1_equipment.
--
-- Pre-apply audit (1 row):
--   Berserker (id=1): array of 2 kits; armaments CSV already had all 3 kit armament UUIDs;
--   equipment CSV "3:4, 5:2". No object-wrapper rows existed.
--
-- Post-apply: remaining_with_loadouts = 0; Berserker level1_armaments/equipment unchanged.

BEGIN;

UPDATE public.codex_archetypes
SET level1_loadouts = CASE
  WHEN jsonb_typeof(level1_loadouts) = 'array' THEN NULL
  WHEN jsonb_typeof(level1_loadouts) = 'object'
       AND (level1_loadouts ? 'armorStep' OR level1_loadouts ? 'sharedEquipment') THEN
    NULLIF(
      jsonb_strip_nulls(jsonb_build_object(
        'armorStep', level1_loadouts->'armorStep',
        'sharedEquipment', level1_loadouts->'sharedEquipment'
      )),
      '{}'::jsonb
    )
  WHEN jsonb_typeof(level1_loadouts) = 'object' THEN NULL
  ELSE level1_loadouts
END
WHERE level1_loadouts IS NOT NULL;

COMMIT;

-- Verify:
-- SELECT id, name, level1_loadouts, level1_armaments, level1_equipment
-- FROM public.codex_archetypes WHERE id = '1';
-- SELECT COUNT(*) FROM public.codex_archetypes WHERE level1_loadouts IS NOT NULL;
