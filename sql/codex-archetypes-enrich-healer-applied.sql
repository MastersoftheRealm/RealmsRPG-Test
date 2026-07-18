-- APPLIED 2026-07-17 via Supabase MCP execute_sql on RealmsRPG-Test.
-- Healer (id=4) guided-creator enrichment  -  TASK-530 path 9/12.
-- Backup: codex_archetypes_backup_20260717
--
-- Intent (power user):
--   - Character (4): medicine + CHA/INT identity.
--   - One archetype group (4): healing package.
--   - Powers group (existing only).
--   - Skills already Medicine, Craft, Nature (keep).
--   - Abilities: Charisma 3 / Intelligence 2 / Vitality 2.
--   - Desc polish + notes. No new powers.

UPDATE public.codex_archetypes
SET
  description = $desc$A mystic physician who uses magic and physiology to lift allies and punish foes. Healers stabilize the dying, burst-heal the wounded, and turn restorative arts into battlefield control.$desc$,
  level1_recommended_abilities = $abil${
    "charisma": 3,
    "intelligence": 2,
    "vitality": 2,
    "strength": 0,
    "agility": 0,
    "acuity": 0
  }$abil$::jsonb,
  level1_feats = '236, 362, 157, 179, 289, 291, 551, 286',
  level1_guidance_groups = $json$[
    {
      "id": "healer-character",
      "title": "Beside the bed",
      "why": "Identity picks for Medicine, faith, and Charisma-backed knowledge.",
      "audience": "character",
      "feats": ["236", "362", "157", "179"]
    },
    {
      "id": "healer-arts",
      "title": "Healing arts",
      "why": "Amplify, burst, and weaponize restorative magic.",
      "audience": "archetype",
      "feats": ["289", "291", "551", "286"]
    },
    {
      "id": "healer-powers",
      "title": "Recommended powers",
      "why": "Heals, bolsters, and a few tools for when mercy fails.",
      "powers": [
        "c7add61f-7b95-454a-ba13-9488604fa10f",
        "1b66058f-3a3a-4e48-ab33-e26a0175cba8",
        "977505f1-d2fe-438e-b499-ef1c5f8679e5",
        "458243d4-50af-4ceb-a410-b91d4139909f",
        "cd16bb99-273a-42fa-978b-f48e83d87561",
        "c8652f3a-399f-406f-9c00-16d6e8ba3772",
        "c4f8432d-1182-44e6-828c-927da091201b"
      ]
    },
    {
      "id": "healer-kit",
      "title": "Recommended gear",
      "why": "Bandages and potions for a field medic.",
      "equipment": ["3:6", "5:2", "6:2", "2"]
    }
  ]$json$::jsonb,
  level1_notes = 'Healing arts feats stack with your powers  -  Healer and Rejuvenating Healing make every Restore hit harder and safer.'
WHERE id = '4'
  AND name = 'Healer';

-- Character (4): Faith Healer, Knowledgeable Surgeon, Divine Inspiration, Educated Socialite
-- Archetype (4): Healer, Healing Burst, Rejuvenating Healing, Harm or Heal
-- Powers: Necrotize, Rapid Heal, Radiant Bolt, Premedicate, Greater Heal, Emergency Heal, Bolster
-- Skills unchanged: Medicine, Craft, Nature
-- Abilities: CHA 3 / INT 2 / VIT 2 = 7
