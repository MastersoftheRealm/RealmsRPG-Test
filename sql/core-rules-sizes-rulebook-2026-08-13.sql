-- Align live core_rules.SIZES with the rulebook size table (owner ack 2026-08-13).
-- Replaces the stale D&D-style {tiny:{name,space:2.5}, ...} blob (no Miniscule/Humongous,
-- spaces in feet) with the categories[] shape the admin Sizes editor and useGameRules fallback use.
-- Mechanical Large spaces stay 2 (rulebook: 1–2). Gargantuan carry is 1600 + 800×STR
-- (rulebook draft had a typo "1600 kg x 800 kg x Strength").
-- Speed is NOT modified by size; over-half carry still halves speed.

UPDATE public.core_rules
SET
  data = '{
    "categories": [
      {"value":"miniscule","label":"Miniscule","height":"Under 30 cm","spaces":0.125,"baseCarry":10,"perStrCarry":5,"minCarry":5},
      {"value":"tiny","label":"Tiny","height":"30–60 cm","spaces":0.25,"baseCarry":25,"perStrCarry":10,"minCarry":10},
      {"value":"small","label":"Small","height":"60–120 cm","spaces":1,"baseCarry":50,"perStrCarry":25,"minCarry":25},
      {"value":"medium","label":"Medium","height":"150–200 cm","spaces":1,"baseCarry":100,"perStrCarry":50,"minCarry":50},
      {"value":"large","label":"Large","height":"200–300 cm","spaces":2,"baseCarry":200,"perStrCarry":100,"minCarry":100},
      {"value":"huge","label":"Huge","height":"300–450 cm","spaces":4,"baseCarry":400,"perStrCarry":200,"minCarry":200},
      {"value":"humongous","label":"Humongous","height":"450–750 cm","spaces":9,"baseCarry":800,"perStrCarry":400,"minCarry":400},
      {"value":"gargantuan","label":"Gargantuan","height":"750+ cm","spaces":16,"baseCarry":1600,"perStrCarry":800,"minCarry":800}
    ],
    "halfCapacitySpeedPenalty": "Movement speed halved",
    "spaceAndShape": "Creatures are classified into size categories based on their height and, in some cases, width. Generally, larger creatures take up more space on a battle map. For instance, a Huge creature occupies 4 spaces. When a creature occupies multiple spaces, those spaces are typically adjacent to one another; some creatures may have unique shapes. A creature whose width matches a larger category’s typical height uses the larger size (for example, a horse about 150 cm tall and 250 cm long is Large).",
    "carryingNotes": "Carrying capacity is determined by size. If you carry more than half your maximum capacity, your movement speed is halved. Regardless of Strength, you can carry at least the size’s minimum (the kilogram bonus you would multiply by Strength) even if Strength is negative — for example, Tiny at Strength −2 still carries 10 kg.",
    "movementThroughEnemySpaces": "When moving through the space of an enemy creature that is your size or smaller, the space is considered difficult terrain. You cannot end your turn in the same space as another creature unless that creature occupies more than double the number of spaces you do (for example, a Medium creature occupying one of the spaces of a Huge creature)."
  }'::jsonb,
  updated_at = now()
WHERE id = 'SIZES';
