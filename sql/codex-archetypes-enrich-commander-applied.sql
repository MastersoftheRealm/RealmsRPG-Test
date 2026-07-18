-- APPLIED 2026-07-17 via Supabase MCP execute_sql on RealmsRPG-Test.
-- Commander (id=2) guided-creator enrichment  -  TASK-530 path 3/12.
-- Backup: codex_archetypes_backup_20260717
--
-- Intent:
--   - Character feats: leadership / social presence (4).
--   - Archetype group A: rally & protect allies.
--   - Archetype group B: hold the line (defense + mount).
--   - Trim skills to 3 base (drop Motivate sub-skill of Persuade).
--   - Do NOT change weapons, techniques, or equipment.
--
-- Kit:
--   Skills → Persuade, Taunt, Athletics (was + Motivate sub)
--   Techniques (unchanged): Commanding Shout, Rallying Cry, Sundering Strike,
--     Goading Shout, Defensive Repositioning
--   Armaments (unchanged): Mace, Warhammer, Wooden Buckler, Scalemail,
--     Tower Shield, Plate Armor
--   Equipment (unchanged): 5:2, 6:2

UPDATE public.codex_archetypes
SET
  level1_skills = '36, 46, 9',
  level1_feats = '343, 127, 53, 85, 51, 124, 507, 259, 34, 717, 430, 152, 106, 446',
  level1_guidance_groups = $json$[
    {
      "id": "commander-character",
      "title": "Voice of command",
      "why": "Identity picks that back Persuade, Taunt, and armored leadership.",
      "audience": "character",
      "feats": ["343", "127", "53", "85"]
    },
    {
      "id": "commander-rally",
      "title": "Rally the ranks",
      "why": "Buff allies, challenge foes, and project a protective presence.",
      "audience": "archetype",
      "feats": ["51", "124", "507", "259"]
    },
    {
      "id": "commander-hold-line",
      "title": "Hold the line",
      "why": "Survive the front and fight from the saddle when the line needs you.",
      "audience": "archetype",
      "feats": ["34", "717", "430", "152", "106", "446"]
    },
    {
      "id": "commander-kit",
      "title": "Weapon & armor picks",
      "why": "Shields and heavy armor for a leader who stands with the ranks.",
      "armaments": [
        "52d37e01-726e-4aba-b088-2bb78b6f70f6",
        "2697fadb-e95c-4a8b-9ba0-2936dce78e55",
        "8ca40c97-851c-4381-a6dd-e0724a6927cf",
        "e10a0a84-95a7-43fb-92ec-b0657c9c4a32",
        "dd0f9247-5f15-4a2f-8278-df2577eabe2a",
        "0df779c8-a33e-4fb2-bd26-4580d01f2c5b"
      ],
      "equipment": ["5:2", "6:2"]
    }
  ]$json$::jsonb,
  level1_notes = 'Pair a Rally the ranks feat with a Hold the line feat  -  support allies while staying hard to drop.'
WHERE id = '2'
  AND name = 'Commander';

-- Feat legend:
-- Character (4): Inspiring Leader (343), Confident Prowess (127), Battle-Ready (53), Brandish (85)
-- Rally (4): Bastion (51), Combat Inspiration (124), Protective Aura (507), Forceful Challenge (259)
-- Hold the line (6): Armor Bearer (34), Unbreakable Soul (717), Multiattack Defense (430),
--   Die Hard (152), Cavalry (106), One Warrior (446)
-- Skills: dropped Motivate (31, sub of Persuade)
