-- APPLIED with Monk batch 2026-07-17  -  recommended ability layouts.
-- Rules: primary = 3, secondary ≥ 2, Ability Point cost sum = 7,
-- each −2…+3, total negatives ≥ −3. Classic TTRPG-ish dumps where it fits.
-- Backup: codex_archetypes_backup_20260717

-- Berserker (STR / VIT): classic barbarian  -  peak Strength, solid Vitality, dump Intelligence
UPDATE public.codex_archetypes
SET level1_recommended_abilities = $json${
  "strength": 3,
  "vitality": 2,
  "agility": 2,
  "acuity": 1,
  "charisma": 0,
  "intelligence": -1
}$json$::jsonb
WHERE id = '1' AND name = 'Berserker';
-- cost: 3+2+2+1+0+(-1) = 7

-- Assassin (AGI / CHA): classic rogue  -  Dexterity, face Charisma, some Acuity, dump Strength
UPDATE public.codex_archetypes
SET level1_recommended_abilities = $json${
  "agility": 3,
  "charisma": 2,
  "acuity": 2,
  "vitality": 1,
  "intelligence": 0,
  "strength": -1
}$json$::jsonb
WHERE id = '6' AND name = 'Assassin';
-- cost: 3+2+2+1+0+(-1) = 7

-- Commander (STR / CHA): warlord/paladin-leader  -  Strength + Charisma + Vitality, no INT dump
UPDATE public.codex_archetypes
SET level1_recommended_abilities = $json${
  "strength": 3,
  "charisma": 2,
  "vitality": 2,
  "agility": 0,
  "acuity": 0,
  "intelligence": 0
}$json$::jsonb
WHERE id = '2' AND name = 'Commander';
-- cost: 3+2+2+0+0+0 = 7
