-- APPLIED 2026-07-17 via Supabase MCP execute_sql on RealmsRPG-Test.
-- Berserker (id=1) guided-creator enrichment  -  TASK-530 path 1/12.
-- Backup: codex_archetypes_backup_20260717
--
-- Intent (rev 2  -  owner feedback):
--   - Fewer, path-specific character feats (intimidation / Strength-as-presence).
--   - Archetype group A = rage STATE feats (state_feat).
--   - Archetype group B = stay-in-the-fight pressure / sustain (non-state).
--   - Do NOT change weapons, techniques, equipment, skills, or abilities.
--
-- Kit left unchanged (for context):
--   Skills: Taunt, Athletics, Intimidate
--   Techniques: Sundering Strike, Headbutt, Goading Shout
--   Armaments: Battleaxe, Greatsword, Scalemail
--   Equipment: Bandage:4, Health Potion:2

UPDATE public.codex_archetypes
SET
  level1_feats = '275, 85, 352, 530, 753, 536, 269, 313, 63, 78, 465, 546, 544',
  level1_guidance_groups = $json$[
    {
      "id": "berserker-character",
      "title": "Presence and pressure",
      "why": "Strength-forward identity picks that feed Taunt and Intimidate.",
      "audience": "character",
      "feats": ["275", "85", "352"]
    },
    {
      "id": "berserker-rage-state",
      "title": "Rage state",
      "why": "Enter State feats that turn aggression into damage, grit, and aura pressure.",
      "audience": "archetype",
      "feats": ["530", "753", "536", "269"]
    },
    {
      "id": "berserker-stay-fighting",
      "title": "Stay in the fight",
      "why": "Strength spikes and reckless pressure while the battle is still hot.",
      "audience": "archetype",
      "feats": ["313", "63", "78", "465", "546", "544"]
    },
    {
      "id": "berserker-kit",
      "title": "Weapon & armor picks",
      "why": "Heavy hitters that match an all-in melee style.",
      "armaments": [
        "3a4ce0e0-aa9e-4429-a55d-86fdbd6bfdcb",
        "486b9ac9-16e3-49f8-80de-6d4c9ebbf3bc",
        "8ca40c97-851c-4381-a6dd-e0724a6927cf"
      ],
      "equipment": ["3:4", "5:2"]
    }
  ]$json$::jsonb,
  level1_notes = 'Pick a Rage state feat and a Stay in the fight feat that work together, then customize weapons and armor if you want a different heavy-hitter kit.'
WHERE id = '1'
  AND name = 'Berserker';

-- Feat legend:
-- Character (3): Goading Strength (275), Brandish (85), Intimidating Presence (352)
-- Rage state (4): Rage (530), Wild Vitality (753), Rapid Recovery (536), Frightful Aura (269)
-- Stay in the fight (6): Hysteria (313), Berserk (63), Bloodlust (78), Personal Best (465),
--   Reckless Attack (546), Reaper's Vitality (544)
-- Dropped from prior L1 flat list: Re-vitalizing Recovery (538)  -  still available via L2 browse

-- Post-apply check (run after owner says apply):
-- SELECT name, level1_feats, level1_guidance_groups FROM codex_archetypes WHERE id = '1';
