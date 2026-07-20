-- APPLIED 2026-07-20 on RealmsRPG-Test (lbqhiwudvifmkjtkccdg) via apply_migration.
-- Purpose: Drop deprecated weapon_name scalar on technique tables.
-- Attack display labels (No Attack / Unarmed / Weapon) are derived from parts +
-- payload.attackMode in app code (lib/attack-mode.ts / library-columnar.ts).
--
-- Prerequisite: sql/zero-add-weapon-option-levels-applied.sql (tied weapons stripped,
-- attackMode backfilled).

ALTER TABLE public.official_techniques DROP COLUMN IF EXISTS weapon_name;
ALTER TABLE public.user_techniques DROP COLUMN IF EXISTS weapon_name;
ALTER TABLE public.official_empowered_techniques DROP COLUMN IF EXISTS weapon_name;
ALTER TABLE public.user_empowered_techniques DROP COLUMN IF EXISTS weapon_name;
