-- APPLIED 2026-07-17 via Supabase MCP execute_sql on RealmsRPG-Test.
-- Monk (id=monk) guided-creator enrichment  -  TASK-530 path 4/12.
-- Backup: codex_archetypes_backup_20260717
--
-- Intent:
--   - Keep existing 4 character feats (already path-specific).
--   - Archetype group A: unarmed / monk weapon offense.
--   - Archetype group B: unarmored evasion & mobility.
--   - Player-facing description (strip developer "The Build" notes).
--   - Recommended abilities: Agility 3 / Acuity 2 / Vitality 2 (sum cost 7; primary 3, secondary ≥2).
--   - Do NOT change weapons, techniques, equipment, skills, or unarmed flag.
--
-- Kit unchanged:
--   Skills: Acrobatics, Stealth, Perceive
--   Techniques: Unarmed Barrage, 8 Trigrams 64-Palms, Catch Melee Attack,
--     Rush-Palm, Side-Step
--   Armaments: Kunai Knives, Paired Knives:2, Quaterstaff
--   Equipment: 2, 7, 5, 6, 1
--   level1_recommend_unarmed_prowess: true

UPDATE public.codex_archetypes
SET
  description = $desc$A disciplined fighter who masters unarmed prowess and light monk weaponry. Monks dodge rather than armor up, landing many lighter strikes each turn and reading the battlefield with sharp Acuity.$desc$,
  level1_recommended_abilities = $abil${
    "agility": 3,
    "acuity": 2,
    "vitality": 2,
    "strength": 0,
    "intelligence": 0,
    "charisma": 0
  }$abil$::jsonb,
  level1_feats = '434, 464, 606, 642, 742, 641, 419, 104, 704, 713, 492',
  level1_guidance_groups = $json$[
    {
      "id": "monk-character",
      "title": "Mind and body",
      "why": "Identity picks for mobility, insight, and disciplined awareness.",
      "audience": "character",
      "feats": ["434", "464", "606", "642"]
    },
    {
      "id": "monk-unarmed",
      "title": "Way of the fist",
      "why": "Unarmed flurries, monk weapons, and catching what comes at you.",
      "audience": "archetype",
      "feats": ["742", "641", "419", "104"]
    },
    {
      "id": "monk-unarmored",
      "title": "Unarmored flow",
      "why": "Stay light  -  more speed, more Evasion, sharper dodges.",
      "audience": "archetype",
      "feats": ["704", "713", "492"]
    },
    {
      "id": "monk-kit",
      "title": "Weapon picks",
      "why": "Light monk weapons alongside Unarmed Prowess.",
      "armaments": [
        "3280934b-4b40-49c8-81d2-937825424d45",
        "941b5ad0-2b9a-4835-a907-d30989714021:2",
        "9123ee44-2a3d-4a78-b891-787329eeff44"
      ],
      "equipment": ["2", "7", "5", "6", "1"]
    }
  ]$json$::jsonb,
  level1_notes = 'Lean into Unarmed Prowess with Way of the fist, and stay unarmored so Unarmored flow pays off.'
WHERE id = 'monk'
  AND name = 'Monk';

-- Feat legend:
-- Character (4): Nimble (434), People Reader (464), Slow Fall (606), Strike of Truth (642)
-- Way of the fist (4): Way of the Monk (742), Strike of Force (641), Monk Weaponry (419), Catch Projectile (104)
-- Unarmored flow (3): Unarmored Agility (704), Unarmored Evasion (713), Predictive Dodging (492)
