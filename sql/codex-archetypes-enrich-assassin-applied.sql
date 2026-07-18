-- APPLIED 2026-07-17 via Supabase MCP execute_sql on RealmsRPG-Test.
-- Assassin (id=6) guided-creator enrichment  -  TASK-530 path 2/12.
-- Backup: codex_archetypes_backup_20260717
--
-- Intent:
--   - Character feats: lean stealth / sleight / disguise (4), path-specific.
--   - Archetype group A: ambush & stealth damage.
--   - Archetype group B: opening-strike / initiative pressure.
--   - Do NOT change weapons, techniques, equipment, or skills.
--
-- Kit left unchanged:
--   Skills: Stealth, Sleight of Hand, Deceive
--   Techniques: Assasinate, Expert Evasion, Disarm
--   Armaments: Kunai Knives, Rapier, Studded Leather, Dagger
--   Equipment: 10, 2, 8

UPDATE public.codex_archetypes
SET
  level1_feats = '18, 449, 401, 434, 49, 432, 523, 141, 36, 42, 541, 172',
  level1_guidance_groups = $json$[
    {
      "id": "assassin-character",
      "title": "Shadow and sleight",
      "why": "Identity picks that match Stealth, Sleight of Hand, and Deceive.",
      "audience": "character",
      "feats": ["18", "449", "401", "434"]
    },
    {
      "id": "assassin-ambush",
      "title": "Ambush from hiding",
      "why": "Hit harder and stay unseen when you strike from stealth.",
      "audience": "archetype",
      "feats": ["49", "432", "523", "141"]
    },
    {
      "id": "assassin-opening",
      "title": "Opening strike",
      "why": "Win the first moments of combat with initiative and burst.",
      "audience": "archetype",
      "feats": ["36", "42", "541", "172"]
    },
    {
      "id": "assassin-kit",
      "title": "Weapon & armor picks",
      "why": "Light, precise weapons that favor finesse and stealth.",
      "armaments": [
        "3280934b-4b40-49c8-81d2-937825424d45",
        "440bfdee-94ff-4d15-af2b-cd1bb8229111",
        "a05026f9-4f91-4c88-829d-21eb20e451c9",
        "4e4ee300-2afa-4641-9111-39521d33cedb"
      ],
      "equipment": ["10", "2", "8"]
    }
  ]$json$::jsonb,
  level1_notes = 'Pair an Ambush from hiding feat with an Opening strike feat  -  look for combos that reward attacking from stealth or winning initiative.'
WHERE id = '6'
  AND name = 'Assassin';

-- Feat legend:
-- Character (4): Agile Escape (18), Opportunistic Pickpocket (449),
--   Master of Disguise (401), Nimble (434)
-- Ambush (4): Backstab (49), Must've Been the Wind (432), Quick Stealth (523), Deadly Strike (141)
-- Opening (4): Assassin's Delight (36), At the Ready (42), Ready for Action (541), Dueling (172)
-- Added vs prior flat list: Master of Disguise, Nimble (character). Flat list already had the rest.
