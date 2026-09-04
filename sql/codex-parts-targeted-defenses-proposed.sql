-- Proposed: fill codex_parts.defense only where the description clearly names
-- a targeted defense (e.g. "Targets Fortitude", "Targets Evasion").
-- Do NOT apply until owner review (realms-codex-data).
--
-- Live audit 2026-09-03: 85/420 parts already have defense; 335 empty.
-- Regex preview of empty rows is noisy (mentions of Evasion as a stat, "when
-- targeted", meta parts like Alternate Targeted Defense). This file lists only
-- conservative fills. Leave empty parts that do not actually target a defense.

-- Preview (read-only):
-- SELECT id, name, type, defense, LEFT(description, 200)
-- FROM codex_parts
-- WHERE id IN (
--   '138','193','141','131','341','336','240','239','243','246','244','245',
--   '60','14','38','182'
-- );

-- Owner apply: uncomment the UPDATE below after reviewing names.

/*
UPDATE codex_parts AS p
SET defense = v.defense
FROM (VALUES
  ('138', 'Fortitude, Resolve, Mental Fortitude'), -- Battle Disable
  ('193', 'Mental Fortitude, Resolve, Fortitude'), -- Curse
  ('141', 'Evasion'), -- Decrease Critical Range
  ('131', 'Evasion'), -- Remove Condition (unwilling)
  ('341', 'Fortitude'), -- Stun
  ('336', 'Might'), -- Swap (unwilling creature)
  ('240', 'Fortitude'), -- True Light Damage
  ('239', 'Evasion'), -- True Magic Damage
  ('243', 'Fortitude'), -- True Poison or Necrotic Damage
  ('246', 'Mental Fortitude'), -- True Psychic Damage
  ('244', 'Fortitude'), -- True Sonic Damage
  ('245', 'Resolve'), -- True Spiritual Damage
  ('60', 'Resolve'), -- Goad
  ('14', 'Fortitude'), -- Slow
  ('38', 'Fortitude'), -- Weaken (Technique)
  ('182', 'Resolve') -- Compelled Duel
) AS v(id, defense)
WHERE p.id::text = v.id
  AND (p.defense IS NULL OR btrim(p.defense) = '');
*/
