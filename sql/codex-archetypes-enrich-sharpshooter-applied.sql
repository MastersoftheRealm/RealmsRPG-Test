-- APPLIED 2026-07-17 via Supabase MCP execute_sql on RealmsRPG-Test.
-- Sharpshooter (id=11) guided-creator enrichment  -  TASK-530 path 5/12.
-- Backup: codex_archetypes_backup_20260717
--
-- Intent:
--   - Trim oversized feat list (19 → curated groups).
--   - Character (3): observation / wilderness / prep (existing char feats).
--   - Archetype A: deadeye ranged damage.
--   - Archetype B: skirmish mobility & hunt pressure.
--   - Skills: drop Search sub → Perceive, Analyze, Stealth.
--   - Abilities: Acuity 3 / Agility 2 / Vitality 2 (primary 3, secondary ≥2, cost 7).
--   - Light description polish + notes.
--   - Do NOT add weapons/techniques (Longbow, Heavy Crossbow kept).

UPDATE public.codex_archetypes
SET
  description = $desc$A careful hunter who wins fights at range. Sharpshooters read the field, kite dangerous foes, and put arrows or bolts exactly where they hurt most.$desc$,
  level1_skills = '34, 5, 42',
  level1_recommended_abilities = $abil${
    "acuity": 3,
    "agility": 2,
    "vitality": 2,
    "strength": 0,
    "intelligence": 0,
    "charisma": 0
  }$abil$::jsonb,
  level1_feats = '347, 396, 455, 592, 636, 490, 531, 235, 361, 413, 282, 219, 427',
  level1_guidance_groups = $json$[
    {
      "id": "sharpshooter-character",
      "title": "Eyes in the wild",
      "why": "Identity picks for noticing threats and vanishing into terrain.",
      "audience": "character",
      "feats": ["347", "396", "455"]
    },
    {
      "id": "sharpshooter-deadeye",
      "title": "Deadeye",
      "why": "Ranged damage, aim, and long-shot pressure.",
      "audience": "archetype",
      "feats": ["592", "636", "490", "531", "235"]
    },
    {
      "id": "sharpshooter-skirmish",
      "title": "Skirmish hunt",
      "why": "Stay mobile, punish pursuers, and keep the hunt on your terms.",
      "audience": "archetype",
      "feats": ["361", "413", "282", "219", "427"]
    },
    {
      "id": "sharpshooter-kit",
      "title": "Weapon picks",
      "why": "Signature ranged weapons for this path.",
      "armaments": [
        "2ae15049-1979-49ed-a837-be7d99fc5bfd",
        "508f5252-2015-4b8d-8960-8085630bedd8"
      ]
    }
  ]$json$::jsonb,
  level1_notes = 'Pair a Deadeye feat with a Skirmish hunt feat  -  land the shot, then stay out of reach.'
WHERE id = '11'
  AND name = 'Sharpshooter';

-- Dropped from prior L1 flat list (still L2 browse): Invasive Attack, Momentum Teleportation,
-- Overextend, Sanctuary, Sentinel, Two-Handed Power.
-- Skills: dropped Search (39, sub-skill).
-- Abilities cost: 3+2+2+0+0+0 = 7.
