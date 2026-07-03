-- Feat tag unification — Phase 1
-- Defines map_feat_tag_phase1 only. Run BEFORE phase 2.
--
-- Status (RealmsRPG-Test lbqhiwudvifmkjtkccdg):
--   Functions + codex_feats.tags data applied ad-hoc 2026-07-03 (not in schema_migrations).
--   normalize_feat_tags lives in feat-tags-unification-phase2.sql (chains phase 2).
--
-- Safe merges: spelling duplicates, redundant State tag, obvious synonyms,
-- ability/skill bonus consolidation, hybrid archetype naming.
-- Tags remain comma-separated; trailing comma preserved when tags exist.
-- Owner review required before re-applying data UPDATE — see .cursor/rules/realms-codex-data.mdc

CREATE OR REPLACE FUNCTION map_feat_tag_phase1(raw text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  tag text := TRIM(raw);
BEGIN
  IF tag = '' THEN
    RETURN NULL;
  END IF;

  RETURN CASE tag
    -- Drop: redundant with schema fields or too vague for filtering
    WHEN 'State' THEN NULL                    -- use state_feat column
    WHEN 'Defensive' THEN NULL                -- overlaps feat category
    WHEN 'Combat' THEN NULL
    WHEN 'Buff' THEN NULL
    WHEN 'Debuff' THEN NULL
    WHEN 'Situational' THEN NULL
    WHEN 'Aggressive' THEN NULL
    WHEN 'Energy' THEN NULL                   -- prefer Energy Cost / Recovery / etc.
    WHEN 'Damage' THEN NULL                   -- prefer Damage Increase / Reduction
    WHEN 'Defense' THEN NULL                  -- prefer Defense Increase / Reduction
    WHEN 'Attack' THEN NULL                   -- prefer Martial Attack / Melee / Ranged
    WHEN 'Focus' THEN NULL
    WHEN 'Control' THEN NULL                    -- overlaps feat category

    -- Spelling / casing
    WHEN 'Re-Roll' THEN 'Re-roll'
    WHEN 'Reroll' THEN 'Re-roll'
    WHEN 'skill' THEN 'Skill'
    WHEN 'Movie Action' THEN 'Move Action'

    -- Synonym merges
    WHEN 'Crafting' THEN 'Craft'
    WHEN 'Brew' THEN 'Craft'
    WHEN 'Brews' THEN 'Craft'
    WHEN 'Grappling' THEN 'Grapple'
    WHEN 'Stunned' THEN 'Stun'
    WHEN 'Frightened' THEN 'Frighten'
    WHEN 'Innate Power' THEN 'Innate'
    WHEN 'Attack Roll Increase' THEN 'Attack Bonus'
    WHEN 'Attack/Potency Increase' THEN 'Attack Bonus'
    WHEN 'Attack Increase' THEN 'Attack Bonus'
    WHEN 'Defense Bonus' THEN 'Defense Increase'
    WHEN 'Damage Bonus' THEN 'Damage Increase'
    WHEN 'Potency Increase' THEN 'Potency Bonus'
    WHEN 'Powered Martial' THEN 'Hybrid'
    WHEN 'Empowered Martial' THEN 'Hybrid'
    WHEN 'Extra Attack' THEN 'Multi-Attack'
    WHEN 'Melee Attack' THEN 'Melee'
    WHEN 'Ranged Attack' THEN 'Ranged'
    WHEN 'Weapon Attack' THEN 'Weapon'
    WHEN 'Sense' THEN 'Perception'
    WHEN 'Senses' THEN 'Perception'
    WHEN 'Perceive' THEN 'Perception'
    WHEN 'Detect' THEN 'Perception'
    WHEN 'Hide' THEN 'Stealth'
    WHEN 'Obscurement' THEN 'Obscured'
    WHEN 'Element' THEN 'Elemental Damage'

    -- Ability bonuses → unified
    WHEN 'Charisma Bonus' THEN 'Ability Bonus'
    WHEN 'Strength Bonus' THEN 'Ability Bonus'
    WHEN 'Might Bonus' THEN 'Ability Bonus'
    WHEN 'Acuity Bonus' THEN 'Ability Bonus'
    WHEN 'Vitality Bonus' THEN 'Ability Bonus'
    WHEN 'Agility' THEN 'Ability Bonus'
    WHEN 'Strength' THEN 'Ability Bonus'

    -- Skill bonuses → unified
    WHEN 'Charisma Skill' THEN 'Skill Bonus'
    WHEN 'Intelligence Skill' THEN 'Skill Bonus'
    WHEN 'Strength Skill' THEN 'Skill Bonus'
    WHEN 'Mental Skill' THEN 'Skill Bonus'
    WHEN 'Skill Check' THEN 'Skill Roll'

  ELSE tag
  END;
END;
$$;

-- Preview after phase 1+2 functions exist (see phase 2 file):
-- SELECT map_feat_tag_phase1('Skill Check');  -- → Skill Roll
