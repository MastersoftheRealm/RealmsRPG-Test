-- APPLIED 2026-07-17 via Supabase MCP execute_sql on RealmsRPG-Test.
-- Beast Tamer (id=3) guided-creator enrichment  -  TASK-530 path 7/12.
-- Backup: codex_archetypes_backup_20260717
--
-- Intent (power user):
--   - Character feats (~4) for beast/nature identity.
--   - One archetype feat group (5)  -  bonded companion package.
--   - Powers guidance group (existing powers only; no new powers).
--   - Skills: drop Tame sub → Beastcraft, Nature, Perceive.
--   - Abilities: Charisma 3 / Acuity 2 / Vitality 2 (cost 7).
--   - Notes polish (player-facing). Innate: left unset (energy unclear from payload).

UPDATE public.codex_archetypes
SET
  description = $desc$A mystic handler who channels magic through a bonded beast companion. Beast Tamers empower allies with enchantments, healing, and primal enhancements  -  the companion is the true force in battle.$desc$,
  level1_skills = '2, 32, 34',
  level1_recommended_abilities = $abil${
    "charisma": 3,
    "acuity": 2,
    "vitality": 2,
    "strength": 0,
    "agility": 0,
    "intelligence": 0
  }$abil$::jsonb,
  level1_feats = '241, 29, 57, 266, 237, 781, 782, 391, 443',
  level1_guidance_groups = $json$[
    {
      "id": "beast-tamer-character",
      "title": "Friend of beasts",
      "why": "Identity picks for speaking with, sensing, and favoring animals.",
      "audience": "character",
      "feats": ["241", "29", "57", "266"]
    },
    {
      "id": "beast-tamer-bond",
      "title": "Bonded companion",
      "why": "Build around a familiar  -  stronger growth, shared senses, and combo strikes.",
      "audience": "archetype",
      "feats": ["237", "781", "782", "391", "443"]
    },
    {
      "id": "beast-tamer-powers",
      "title": "Beast-focused powers",
      "why": "Powers that armor, charm, empower, protect, and mend beast companions.",
      "powers": [
        "3f6d092f-0a5b-42c7-888c-49cf2d589d71",
        "d0841448-4918-4fa0-b6a3-4655b9e7d26e",
        "e8d4d6fe-76f0-424f-beed-afc89b82da93",
        "0bb0c4a1-a1d2-4278-8c22-f07044c3c3b6",
        "5478987a-28ce-46f8-bec3-cade73290ea3"
      ]
    },
    {
      "id": "beast-tamer-kit",
      "title": "Recommended gear",
      "why": "Light supplies for a handler in the field.",
      "equipment": ["8", "5:2", "6:2", "7"]
    }
  ]$json$::jsonb,
  level1_notes = 'Familiar at level 1 is strongly recommended  -  your powers mostly help beasts and allies. Ask your RM about finding or starting with a companion if you skip Familiar.'
WHERE id = '3'
  AND name = 'Beast Tamer';

-- Character (4): Familiar Recall, Animal Speaking, Beast Sense, Friend of Beasts
-- Archetype (5): Familiar, Enhanced Companion, Companion Coordination, Manifest Mind, One Heart One Mind
-- Powers (unchanged IDs): Beast Armor, Charm Beast, Empower Beast, Evasive Beast, Mend Beast
-- Skills: Beastcraft, Nature, Perceive (dropped Tame sub of Beastcraft)
-- Abilities: CHA 3 / ACU 2 / VIT 2 = 7
