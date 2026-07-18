-- APPLIED 2026-07-17 via Supabase MCP execute_sql on RealmsRPG-Test.
-- Elementalist (id=9) guided-creator enrichment  -  TASK-530 path 8/12.
-- Backup: codex_archetypes_backup_20260717
--
-- Intent (power user  -  thin path needs fill-out, not kit expansion):
--   - Write missing description + notes.
--   - Drop Rage (186)  -  Strength state feat, wrong for this path.
--   - One archetype group of elemental feats (keep 3 intended + 3 matching elemental).
--   - Character feats for scholar / Arcana / CHA secondary.
--   - Skills already Arcana, Analyze, Persuade (keep).
--   - Abilities: Intelligence 3 / Charisma 2 / Vitality 2.
--   - Do NOT add powers (only 1 authored  -  keep it).

UPDATE public.codex_archetypes
SET
  description = $desc$A caster who shapes elemental forces  -  fire, ice, lightning, and more  -  by adapting damage types and projecting raw elemental pressure. Elementalists study the weave of elements and bend them mid-cast.$desc$,
  level1_recommended_abilities = $abil${
    "intelligence": 3,
    "charisma": 2,
    "vitality": 2,
    "strength": 0,
    "agility": 0,
    "acuity": 0
  }$abil$::jsonb,
  level1_feats = '40, 806, 179, 576, 248, 187, 692, 181, 189, 192',
  level1_guidance_groups = $json$[
    {
      "id": "elementalist-character",
      "title": "Student of the elements",
      "why": "Identity picks for Arcana study, discovery, and Intelligence-backed presence.",
      "audience": "character",
      "feats": ["40", "806", "179", "576"]
    },
    {
      "id": "elementalist-mastery",
      "title": "Elemental mastery",
      "why": "Adapt, transmute, resist, and project elemental power.",
      "audience": "archetype",
      "feats": ["248", "187", "692", "181", "189", "192"]
    },
    {
      "id": "elementalist-powers",
      "title": "Recommended powers",
      "why": "Path-curated elemental casting (expand in catalog as you grow).",
      "powers": ["4d21f2fc-538e-4150-958e-ef1abc2fc4ef"]
    }
  ]$json$::jsonb,
  level1_notes = 'Elemental mastery feats are your core  -  pair Adaptation or Affinity with Transmutation so your damage type always fits the fight. Rage was removed from this path (Strength state; not elemental).'
WHERE id = '9'
  AND name = 'Elementalist';

-- Character (4): Astute Discovery, Arcana Savant, Educated Socialite, Scholar
-- Archetype (6): Elemental Adaptation, Elemental Emanation, Transmutation,
--   Elemental Affinity, Elemental Resistance, Elemental Ward (L1 tier)
-- Removed: Rage (186)
-- Skills unchanged: Arcana, Analyze, Persuade
-- Abilities: INT 3 / CHA 2 / VIT 2 = 7
-- Powers unchanged: Elemental Burst only (no new powers added)
