-- APPLIED 2026-07-17 via Supabase MCP execute_sql on RealmsRPG-Test.
-- Necromancer (id=5) guided-creator enrichment  -  TASK-530 path 10/12.
-- Abilities use spread layout (INT 3 / CHA 2 / VIT 1 / ACU 1).
-- Backup: codex_archetypes_backup_20260717
--
-- Intent (power user):
--   - Character (4): dark scholar / harvest identity.
--   - One archetype group (4): summoning package (existing feats).
--   - Powers group (existing only).
--   - Skills: Arcana, Medicine, Harvest (keep  -  necro harvest flavor).
--   - Abilities: Intelligence 3 / Charisma 2 / Vitality 2.
--   - Notes polish. Keep unarmed_prowess. No new powers.

UPDATE public.codex_archetypes
SET
  description = $desc$Necromancers bind death to their command  -  raising the fallen, draining life, and cursing the living. Whether leading undead servants or unraveling vitality itself, they turn mortality into a weapon.$desc$,
  level1_recommended_abilities = $abil${
    "intelligence": 3,
    "charisma": 2,
    "vitality": 1,
    "acuity": 1,
    "strength": 0,
    "agility": 0
  }$abil$::jsonb,
  level1_feats = '140, 806, 40, 157, 257, 601, 650, 760',
  level1_guidance_groups = $json$[
    {
      "id": "necromancer-character",
      "title": "Student of the grave",
      "why": "Identity picks for Arcana, discovery, and Charisma-backed Intelligence.",
      "audience": "character",
      "feats": ["140", "806", "40", "157"]
    },
    {
      "id": "necromancer-summons",
      "title": "Grave summons",
      "why": "Focus, spawn, toughen, and arm your summoned dead.",
      "audience": "archetype",
      "feats": ["257", "601", "650", "760"]
    },
    {
      "id": "necromancer-powers",
      "title": "Recommended powers",
      "why": "Raise, empower, sap, and necrotize  -  grow Raise Undead as you level.",
      "powers": [
        "5723bd39-86b6-48d1-bcad-ac80f00e26e1",
        "c7add61f-7b95-454a-ba13-9488604fa10f",
        "38bf86bf-f52f-4675-a085-4fe7ca8c2af5",
        "364633da-1b59-4c8c-b5b2-f7f89659e4c8"
      ]
    },
    {
      "id": "necromancer-kit",
      "title": "Recommended gear",
      "why": "Light supplies for a ritualist in the field.",
      "equipment": ["6:4", "7", "2", "3:2"]
    }
  ]$json$::jsonb,
  level1_notes = 'Raise Undead is weak at level 1 by design  -  plan to empower or replace it as you level so your dead last longer and hit harder. Unarmed Prowess is recommended for this path.'
WHERE id = '5'
  AND name = 'Necromancer';

-- Character (4): Darkvision, Arcana Savant, Astute Discovery, Divine Inspiration
-- Archetype (4): Focused Summoner, Slay Summoning, Summoning Specialty, Wrathful Summons
-- Powers: Raise Undead, Necrotize, Sap Vitality, Empower undead
-- Skills unchanged: Harvest, Medicine, Arcana
-- Abilities: INT 3 / CHA 2 / VIT 2 = 7
