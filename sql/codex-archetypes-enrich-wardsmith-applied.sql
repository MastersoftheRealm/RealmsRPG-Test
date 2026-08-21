-- APPLIED 2026-07-17 via Supabase MCP execute_sql on RealmsRPG-Test.
-- Wardsmith (id=10) guided-creator enrichment  -  TASK-530 path 12/12 (final).
-- Backup: codex_archetypes_backup_20260717
--
-- Intent (power user):
--   - Character (4): fate / prep / perception identity.
--   - One archetype group (4): warding & reactions (existing).
--   - Powers group (existing only).
--   - Skills: trim 5 → Arcana, Perceive, Insight (drop Calligraphy sub + Investigate).
--   - Abilities spread: Intelligence 3 / Agility 2 / Vitality 1 / Acuity 1.
--   - Fix power_prof_start 0 → 2 (match other power paths; was broken for guided).

UPDATE public.codex_archetypes
SET
  description = $desc$Wardsmiths master defensive and predictive magic. With quick reactions and careful planning, they turn fights with wards, shields, and fate-twisting foresight.$desc$,
  power_prof_start = 2,
  level1_skills = '7, 34, 22',
  level1_recommended_abilities = $abil${
    "intelligence": 3,
    "agility": 2,
    "vitality": 1,
    "acuity": 1,
    "strength": 0,
    "charisma": 0
  }$abil$::jsonb,
  level1_feats = '59, 455, 136, 40, 737, 623, 165, 193',
  level1_guidance_groups = $json$[
    {
      "id": "wardsmith-character",
      "title": "Prepared mind",
      "why": "Identity picks for foresight, preparation, and sharp senses.",
      "audience": "character",
      "feats": ["59", "455", "136", "40"]
    },
    {
      "id": "wardsmith-wards",
      "title": "Living wards",
      "why": "Reaction wards, ally shields, and cheaper follow-up reactions.",
      "audience": "archetype",
      "feats": ["737", "623", "165", "193"]
    },
    {
      "id": "wardsmith-powers",
      "title": "Recommended powers",
      "why": "Wards, auras, and bolstering magic for a defensive caster.",
      "powers": [
        "c4f8432d-1182-44e6-828c-927da091201b",
        "d7217970-1005-4c8a-8ccd-28621b5bdd3f",
        "1efe0455-11d2-4283-8d3e-42f0ea9bac18",
        "74393725-78bd-4081-877a-ba5a1879349c",
        "8a55df39-6f25-4bcf-ae50-666c71be05df"
      ]
    }
  ]$json$::jsonb,
  level1_notes = 'Living wards feats reward reacting often  -  Reactive pairs especially well with Warding and Spiritual Shield.'
WHERE id = '10'
  AND name = 'Wardsmith';

-- Character (4): Bend Fate, Overprepared, Danger Sense, Astute Discovery
-- Archetype (4): Warding, Spiritual Shield, Reactive, Elemental Ward
-- Powers: Bolster, Warding Aura, Stone Ward, Protective Ward, Inscribed Sanctum
-- Skills: Arcana, Perceive, Insight (dropped Calligraphy sub, Investigate)
-- Abilities: INT 3 / AGI 2 / VIT 1 / ACU 1 = 7
-- Also: power_prof_start 0 → 2
