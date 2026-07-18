-- APPLIED 2026-07-17 via Supabase MCP execute_sql on RealmsRPG-Test.
-- Warrior (id=8) guided-creator enrichment  -  TASK-530 path 6/12.
-- Backup: codex_archetypes_backup_20260717
--
-- Intent:
--   - Add character feats (path had none curated).
--   - Archetype A: weapon styles (1H / 2H / dual / AoO).
--   - Archetype B: brutal assault pressure.
--   - Skills: expand Athletics-only → Athletics, Intimidate, Perceive.
--   - Abilities: Strength 3 / Agility 2 / Vitality 2 (cost 7).
--   - Light notes; description already strong (kept, slight tighten).
--   - Do NOT add weapons/techniques.

UPDATE public.codex_archetypes
SET
  description = $desc$A master of direct combat who relies on strength, discipline, and hardened skill. Warriors stand on the front line  -  charging in, holding ground, and striking with practiced precision. Their power comes from relentless training, not magic.$desc$,
  level1_skills = '9, 24, 34',
  level1_recommended_abilities = $abil${
    "strength": 3,
    "agility": 2,
    "vitality": 2,
    "acuity": 0,
    "intelligence": 0,
    "charisma": 0
  }$abil$::jsonb,
  level1_feats = '53, 85, 461, 136, 170, 172, 702, 43, 93, 258, 651, 427, 456, 14',
  level1_guidance_groups = $json$[
    {
      "id": "warrior-character",
      "title": "Soldier's habits",
      "why": "Identity picks for a trained fighter who stays ready and reads danger.",
      "audience": "character",
      "feats": ["53", "85", "461", "136"]
    },
    {
      "id": "warrior-styles",
      "title": "Weapon styles",
      "why": "Commit to how you fight  -  dual, dueling, two-handed, or punishing retreats.",
      "audience": "archetype",
      "feats": ["170", "172", "702", "43"]
    },
    {
      "id": "warrior-assault",
      "title": "Brutal assault",
      "why": "Hit harder, hit again, and turn big damage into battlefield control.",
      "audience": "archetype",
      "feats": ["93", "258", "651", "427", "456", "14"]
    },
    {
      "id": "warrior-kit",
      "title": "Weapon & armor picks",
      "why": "A broad fighter kit  -  pick the weight and protection that match your style.",
      "armaments": [
        "0df779c8-a33e-4fb2-bd26-4580d01f2c5b",
        "8ca40c97-851c-4381-a6dd-e0724a6927cf",
        "440bfdee-94ff-4d15-af2b-cd1bb8229111",
        "a05026f9-4f91-4c88-829d-21eb20e451c9",
        "486b9ac9-16e3-49f8-80de-6d4c9ebbf3bc",
        "3a4ce0e0-aa9e-4429-a55d-86fdbd6bfdcb",
        "e10a0a84-95a7-43fb-92ec-b0657c9c4a32",
        "2697fadb-e95c-4a8b-9ba0-2936dce78e55",
        "52d37e01-726e-4aba-b088-2bb78b6f70f6"
      ],
      "equipment": ["5:2", "2", "3:2", "8"]
    }
  ]$json$::jsonb,
  level1_notes = 'Pick a Weapon style that matches your armaments, then a Brutal assault feat to finish the package.'
WHERE id = '8'
  AND name = 'Warrior';

-- Character (4): Battle-Ready, Brandish, Peerless Athlete, Danger Sense
-- Weapon styles (4): Dual Wielder, Dueling, Two-Handed Power, Attack of Opportunity
-- Brutal assault (6): Brute Force, Forceful Blow, Sundering Blow, Multi-Attack,
--   Overwhelming Attack, Advanced Attack
-- Skills: Athletics, Intimidate, Perceive
-- Abilities cost: 3+2+2 = 7
-- Kit unchanged: Sundering Strike, Charging Strike, Disarming Clash + broad armaments
