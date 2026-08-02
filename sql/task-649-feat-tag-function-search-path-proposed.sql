-- TASK-649 Phase 1 (draft) — Pin search_path on feat tag functions (D5)
-- =============================================================================
-- Status: PROPOSED — owner review required before apply (Phase 2).
-- Project: RealmsRPG-Test (lbqhiwudvifmkjtkccdg)
-- Audit ref: archive/CODEBASE_AUDIT_2026-08-01.md §5.2 D5
--
-- Finding: normalize_feat_tags + map_feat_tag_phase{1,2,3} lack explicit
-- search_path (Supabase linter 0011_function_search_path_mutable).
--
-- Fix: CREATE OR REPLACE each function with SET search_path = public.
-- Bodies match live DB as of 2026-08-01 (pg_get_functiondef audit).
--
-- Related: sql/feat-tags-unification-phase{1,2}.sql (add search_path there on
-- next data migration for parity).
--
-- Safe to re-run.
-- =============================================================================

CREATE OR REPLACE FUNCTION public.map_feat_tag_phase1(raw text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $function$
DECLARE
  tag text := TRIM(raw);
BEGIN
  IF tag = '' THEN
    RETURN NULL;
  END IF;

  RETURN CASE tag
    WHEN 'State' THEN NULL
    WHEN 'Defensive' THEN NULL
    WHEN 'Combat' THEN NULL
    WHEN 'Buff' THEN NULL
    WHEN 'Debuff' THEN NULL
    WHEN 'Situational' THEN NULL
    WHEN 'Aggressive' THEN NULL
    WHEN 'Energy' THEN NULL
    WHEN 'Damage' THEN NULL
    WHEN 'Defense' THEN NULL
    WHEN 'Attack' THEN NULL
    WHEN 'Control' THEN NULL
    WHEN 'Re-Roll' THEN 'Re-roll'
    WHEN 'Reroll' THEN 'Re-roll'
    WHEN 'skill' THEN 'Skill'
    WHEN 'Movie Action' THEN 'Move Action'
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
    WHEN 'Charisma Bonus' THEN 'Ability Bonus'
    WHEN 'Strength Bonus' THEN 'Ability Bonus'
    WHEN 'Might Bonus' THEN 'Ability Bonus'
    WHEN 'Acuity Bonus' THEN 'Ability Bonus'
    WHEN 'Vitality Bonus' THEN 'Ability Bonus'
    WHEN 'Agility' THEN 'Ability Bonus'
    WHEN 'Strength' THEN 'Ability Bonus'
    WHEN 'Charisma Skill' THEN 'Skill Bonus'
    WHEN 'Intelligence Skill' THEN 'Skill Bonus'
    WHEN 'Strength Skill' THEN 'Skill Bonus'
    WHEN 'Mental Skill' THEN 'Skill Bonus'
    WHEN 'Skill Check' THEN 'Skill Roll'
  ELSE tag
  END;
END;
$function$;

CREATE OR REPLACE FUNCTION public.map_feat_tag_phase2(raw text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $function$
DECLARE
  tag text := map_feat_tag_phase1(raw);
BEGIN
  IF tag IS NULL THEN RETURN NULL; END IF;
  RETURN CASE tag
    WHEN 'Critical' THEN 'Critical Hit'
    WHEN 'Major Critical Hit' THEN 'Critical Hit'
    WHEN 'Critical Range Reduction' THEN 'Critical Range'
    WHEN 'Bludgeoning Damage' THEN 'Physical Damage'
    WHEN 'Piercing Damage' THEN 'Physical Damage'
    WHEN 'Slashing Damage' THEN 'Physical Damage'
    WHEN 'Fire Damage' THEN 'Elemental Damage'
    WHEN 'Recovery Time' THEN 'Recovery'
    WHEN 'Full Recovery' THEN 'Recovery'
    WHEN 'Partial Recovery' THEN 'Recovery'
    WHEN 'Convince' THEN 'Social'
    WHEN 'Negotiate' THEN 'Social'
    WHEN 'Skill' THEN 'Skill Bonus'
    WHEN 'Familiar' THEN 'Companion'
    WHEN 'Free Summon' THEN 'Summon'
    WHEN 'Support' THEN NULL
    WHEN 'Reliability' THEN NULL
    WHEN 'Versatile' THEN NULL
  ELSE tag
  END;
END;
$function$;

CREATE OR REPLACE FUNCTION public.map_feat_tag_phase3(raw text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $function$
DECLARE
  tag text := map_feat_tag_phase2(raw);
BEGIN
  IF tag IS NULL THEN RETURN NULL; END IF;
  RETURN CASE tag
    WHEN 'Attack Roll' THEN 'Attack Bonus'
    WHEN 'Attack Roll Decrease' THEN 'Attack Debuff'
    WHEN 'Attack Penalty' THEN 'Attack Debuff'
    WHEN 'Martial Bonus Increase' THEN 'Martial Bonus'
    WHEN 'Line Attack' THEN 'Area of Effect'
    WHEN 'Intimidate' THEN 'Intimidation'
    WHEN 'Taunt' THEN 'Intimidation'
    WHEN 'Deception' THEN 'Deceive'
    WHEN 'Audience' THEN 'Social'
    WHEN 'Performance' THEN 'Act'
    WHEN 'Mimicry' THEN 'Deceive'
    WHEN 'Hidden Message' THEN 'Deceive'
    WHEN 'Speed' THEN 'Speed Increase'
    WHEN 'Speed Reduction' THEN 'Slow'
    WHEN 'Melee Range Increase' THEN 'Range Increase'
    WHEN 'Terminal Range' THEN 'Terminal'
    WHEN 'Terminal Increase' THEN 'Terminal'
    WHEN 'Swim' THEN 'Movement'
    WHEN 'Jump' THEN 'Movement'
    WHEN 'Evasion Debuff' THEN 'Evasion Decrease'
    WHEN 'Mental Defense' THEN 'Defense Increase'
    WHEN 'Psychic Damage Resistance' THEN 'Damage Resistance'
    WHEN 'Resistance Reduction' THEN 'Damage Reduction'
    WHEN 'Attack Avoidance' THEN 'Dodge'
    WHEN 'Damage Avoidance' THEN 'Dodge'
    WHEN 'Defense Debuff' THEN 'Defense Reduction'
    WHEN 'Feat Uses' THEN 'Feat Use'
    WHEN 'Feat Acquisition' THEN 'Feat Bonus'
    WHEN 'Training Point Cost' THEN 'Training Points'
    WHEN 'Power Use' THEN 'Power'
    WHEN 'Power Acquisition' THEN 'Power'
    WHEN 'Power Part Modification' THEN 'Power'
    WHEN 'Power Improvisation' THEN 'Power'
    WHEN 'Cast Time' THEN 'Energy Cost'
    WHEN 'Weapon Properties' THEN 'Weapon Property'
    WHEN 'Add Weapon' THEN 'Weapon'
    WHEN 'Unarmed' THEN 'Unarmed Prowess'
    WHEN 'Ammunition' THEN 'Ranged Weapon'
    WHEN 'Monk Weapon' THEN 'Weapon'
    WHEN 'Two-Handed' THEN 'Weapon Property'
    WHEN 'Armor Properties' THEN 'Armor'
    WHEN 'Armor Penetration' THEN 'Armor'
    WHEN 'Unseen' THEN 'Hidden'
    WHEN 'Beast Sense' THEN 'Perception'
    WHEN 'Darkvision' THEN 'Perception'
    WHEN 'Hearing' THEN 'Perception'
    WHEN 'Divine Sense' THEN 'Perception'
    WHEN 'Shadow' THEN 'Darkness'
    WHEN 'Recall History' THEN 'Recall'
    WHEN 'Information Gathering' THEN 'Search'
    WHEN 'Learn' THEN 'Knowledge'
    WHEN 'Commune with Nature' THEN 'Survival'
    WHEN 'Navigate' THEN 'Survival'
    WHEN 'Rest' THEN 'Recovery'
    WHEN 'Downtime' THEN 'Recovery'
    WHEN 'Dazed' THEN 'Stun'
    WHEN 'Stagger' THEN 'Stun'
    WHEN 'Immobile' THEN 'Slow'
    WHEN 'Blind' THEN 'Blinded'
    WHEN 'Arcane' THEN 'Magic Damage'
    WHEN 'Ability Cap' THEN 'Ability Bonus'
    WHEN 'Skill Cap' THEN 'Skill Bonus'
    WHEN 'Stat Bonus' THEN 'Ability Bonus'
    WHEN 'Ability Roll' THEN 'Skill Roll'
    WHEN 'Skill Points' THEN 'Skill Bonus'
    WHEN 'Overcome Rolls' THEN 'Skill Roll'
    WHEN 'Attacked Triggered' THEN 'Reaction'
    WHEN 'Attacking Triggered' THEN 'Reaction'
    WHEN 'Basic Action Reaction' THEN 'Basic Action'
    WHEN 'Combat Start' THEN 'First Strike'
    WHEN 'Moving Target' THEN 'Attack Debuff'
    WHEN 'Stationary Target' THEN 'Attack Bonus'
    WHEN 'Repair' THEN 'Craft'
    WHEN 'Tinker' THEN 'Craft'
    WHEN 'Consumable' THEN 'Craft'
    WHEN 'Harvest' THEN 'Craft'
    WHEN 'Cooking' THEN 'Craft'
    WHEN 'Speak with Animals' THEN 'Beastcraft'
    WHEN 'Bond' THEN 'Companion'
    WHEN 'Automaton' THEN 'Companion'
    WHEN 'Astral Form' THEN 'Shapeshift'
    WHEN 'Astral Sight' THEN 'Perception'
    WHEN 'Incorporeal' THEN 'Shapeshift'
    WHEN 'Size Change' THEN 'Shapeshift'
    WHEN 'Size Increase' THEN 'Shapeshift'
    WHEN 'Water Breathing' THEN 'Survival'
    WHEN 'Telekinesis' THEN 'Power'
    WHEN 'Help' THEN 'Ally'
    WHEN 'Solo' THEN 'Ability Bonus'
    WHEN 'Luck' THEN 'Re-roll'
    WHEN 'Environment' THEN 'Survival'
    WHEN 'Code' THEN NULL
    WHEN 'Currency' THEN NULL
    WHEN 'Device' THEN NULL
    WHEN 'Carry' THEN 'Athletics'
    WHEN 'Lifting' THEN 'Athletics'
    WHEN 'Wall' THEN 'Movement'
    WHEN 'Water' THEN 'Movement'
    WHEN 'Light' THEN 'Light Damage'
    WHEN 'Dance' THEN 'Act'
    WHEN 'Rite' THEN 'Innate'
    WHEN 'Riddle' THEN 'Social'
    WHEN 'Pickpocket' THEN 'Sleight of Hand'
    WHEN 'Apply Condition' THEN NULL
    WHEN 'Add Element' THEN 'Elemental Damage'
    WHEN 'Change Damage Type' THEN 'Elemental Damage'
    WHEN 'Heroic Determination' THEN 'Inspiration'
    WHEN 'Resilience' THEN 'Defense Increase'
    WHEN 'Initiative Increase' THEN 'Speed Increase'
    WHEN 'Energy Drain' THEN 'Energy Cost'
    WHEN 'Energy Share' THEN 'Energy Cost'
    WHEN 'Critical Multiplier' THEN 'Critical Hit'
    WHEN 'Action Point Gain' THEN 'Action Point'
    WHEN 'Surprise Immunity' THEN 'Frighten Immunity'
    WHEN 'Surprised' THEN 'Frighten'
    WHEN 'Timeless' THEN 'Duration Increase'
    WHEN 'Triage' THEN 'Heal'
    WHEN 'Medicine' THEN 'Heal'
    WHEN 'Resurrection' THEN 'Heal'
    WHEN 'Ingest' THEN 'Craft'
  ELSE tag
  END;
END;
$function$;

CREATE OR REPLACE FUNCTION public.normalize_feat_tags(tag_string text)
RETURNS text
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $function$
  SELECT CASE
    WHEN mapped IS NULL OR mapped = '' THEN NULL
    ELSE mapped || ','
  END
  FROM (
    SELECT string_agg(DISTINCT t, ',' ORDER BY t) AS mapped
    FROM (
      SELECT map_feat_tag_phase3(unnest(string_to_array(COALESCE(tag_string, ''), ','))) AS t
    ) sub
    WHERE t IS NOT NULL AND t <> ''
  ) agg;
$function$;

-- -----------------------------------------------------------------------------
-- Verification (run after apply)
-- -----------------------------------------------------------------------------
-- SELECT proname, proconfig FROM pg_proc p
-- JOIN pg_namespace n ON n.oid = p.pronamespace
-- WHERE n.nspname = 'public'
--   AND proname IN ('normalize_feat_tags','map_feat_tag_phase1',
--                   'map_feat_tag_phase2','map_feat_tag_phase3');
-- Expect: proconfig includes search_path=public for all four.
--
-- SELECT normalize_feat_tags('Skill Check,Re-Roll');
-- Re-check get_advisors: function_search_path_mutable cleared for these four.
-- -----------------------------------------------------------------------------
