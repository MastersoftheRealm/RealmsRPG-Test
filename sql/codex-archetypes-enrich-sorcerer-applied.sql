-- APPLIED 2026-07-17 via Supabase MCP execute_sql on RealmsRPG-Test.
-- Sorcerer (id=7) guided-creator enrichment  -  TASK-530 path 11/12.
-- Backup: codex_archetypes_backup_20260717
--
-- Intent (power user):
--   - Character (4): presence / performance identity.
--   - One archetype group (5): metamagic-style casting feats (existing).
--   - Powers group (existing only).
--   - Skills: Arcana, Insight, Perform (keep).
--   - Abilities spread: Charisma 3 / Acuity 2 / Vitality 1 / Agility 1.

UPDATE public.codex_archetypes
SET
  description = $desc$You wield magic like putty  -  spontaneous, innate power shaped by will. Sorcerers twist range, duration, and force on the fly, casting from presence as much as study.$desc$,
  level1_recommended_abilities = $abil${
    "charisma": 3,
    "acuity": 2,
    "vitality": 1,
    "agility": 1,
    "strength": 0,
    "intelligence": 0
  }$abil$::jsonb,
  level1_feats = '100, 127, 129, 179, 155, 195, 373, 535, 701',
  level1_guidance_groups = $json$[
    {
      "id": "sorcerer-character",
      "title": "Innate presence",
      "why": "Identity picks for performance, charm, and Charisma-led social power.",
      "audience": "character",
      "feats": ["100", "127", "129", "179"]
    },
    {
      "id": "sorcerer-metamagic",
      "title": "Shape the weave",
      "why": "Metamagic-style feats that stretch, twin, empower, and hasten your casting.",
      "audience": "archetype",
      "feats": ["155", "195", "373", "535", "701"]
    },
    {
      "id": "sorcerer-powers",
      "title": "Recommended powers",
      "why": "A flexible starter set  -  reshape them with Shape the weave feats.",
      "powers": [
        "35817a15-5e6e-42bc-8c72-53bebde3cae9",
        "73056f44-b0d0-4ec4-a302-818b5837e0c5",
        "e196532f-4016-4d51-a9dc-ebb75ab3df4d",
        "4d21f2fc-538e-4150-958e-ef1abc2fc4ef",
        "26ee226a-975b-48f7-b839-7648744737f0"
      ]
    },
    {
      "id": "sorcerer-kit",
      "title": "Recommended gear",
      "why": "Light supplies for a caster on the move.",
      "equipment": ["6:4", "5:2", "2"]
    }
  ]$json$::jsonb,
  level1_notes = 'Shape the weave feats are your signature  -  Rapid Cast and Twinned Power change how every power feels.'
WHERE id = '7'
  AND name = 'Sorcerer';

-- Character (4): Captivating Performance, Confident Prowess, Countercharm, Educated Socialite
-- Archetype (5): Distant Power, Empowered Cast, Lengthened Power, Rapid Cast, Twinned Power
-- Abilities: CHA 3 / ACU 2 / VIT 1 / AGI 1 = 7
