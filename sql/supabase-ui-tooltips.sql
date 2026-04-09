-- UI Tooltips + user tooltip visibility preference
-- Run in Supabase SQL Editor.

-- 1) User preference on existing profile table
ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS show_tooltips BOOLEAN NOT NULL DEFAULT true;

-- 2) Tooltips table
CREATE TABLE IF NOT EXISTS public.ui_tooltips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  scope TEXT NOT NULL,
  title TEXT,
  body_md TEXT NOT NULL,
  placement TEXT NOT NULL DEFAULT 'top' CHECK (placement IN ('top', 'bottom', 'left', 'right')),
  trigger TEXT NOT NULL DEFAULT 'auto' CHECK (trigger IN ('auto', 'hover', 'focus', 'click')),
  audience TEXT NOT NULL DEFAULT 'new_player' CHECK (audience IN ('new_player', 'all', 'admin')),
  enabled BOOLEAN NOT NULL DEFAULT true,
  version INTEGER NOT NULL DEFAULT 1,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_ui_tooltips_scope ON public.ui_tooltips(scope);
CREATE INDEX IF NOT EXISTS idx_ui_tooltips_enabled ON public.ui_tooltips(enabled);
CREATE INDEX IF NOT EXISTS idx_ui_tooltips_audience ON public.ui_tooltips(audience);

CREATE OR REPLACE FUNCTION public.set_ui_tooltips_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_ui_tooltips_updated_at ON public.ui_tooltips;
CREATE TRIGGER trigger_ui_tooltips_updated_at
BEFORE UPDATE ON public.ui_tooltips
FOR EACH ROW
EXECUTE FUNCTION public.set_ui_tooltips_updated_at();

-- 3) RLS + grants
ALTER TABLE public.ui_tooltips ENABLE ROW LEVEL SECURITY;

GRANT SELECT ON public.ui_tooltips TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.ui_tooltips TO authenticated;

DROP POLICY IF EXISTS ui_tooltips_read ON public.ui_tooltips;
CREATE POLICY ui_tooltips_read
ON public.ui_tooltips
FOR SELECT
TO anon, authenticated
USING (true);

DROP POLICY IF EXISTS ui_tooltips_admin_insert ON public.ui_tooltips;
CREATE POLICY ui_tooltips_admin_insert
ON public.ui_tooltips
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.user_profiles up
    WHERE up.id::text = auth.uid()::text
      AND up.role = 'admin'
  )
);

DROP POLICY IF EXISTS ui_tooltips_admin_update ON public.ui_tooltips;
CREATE POLICY ui_tooltips_admin_update
ON public.ui_tooltips
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.user_profiles up
    WHERE up.id::text = auth.uid()::text
      AND up.role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.user_profiles up
    WHERE up.id::text = auth.uid()::text
      AND up.role = 'admin'
  )
);

DROP POLICY IF EXISTS ui_tooltips_admin_delete ON public.ui_tooltips;
CREATE POLICY ui_tooltips_admin_delete
ON public.ui_tooltips
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.user_profiles up
    WHERE up.id::text = auth.uid()::text
      AND up.role = 'admin'
  )
);

-- 4) Initial seed tooltips
INSERT INTO public.ui_tooltips (key, scope, title, body_md, placement, trigger, audience, enabled, version)
VALUES
  (
    'global.nav.library',
    'global:nav',
    'Library',
    '**Realms Library** contains official content.\n**My Library** is your personal saved collection.\nUse Library to add or customize Powers, Techniques, Armaments, and Creatures.',
    'bottom',
    'auto',
    'new_player',
    true,
    1
  ),
  (
    'global.nav.codex',
    'global:nav',
    'Codex',
    'The Codex is your rules and reference index for Skills, Feats, Species, Parts, and Equipment.\nUse it while creating Characters or custom content.',
    'bottom',
    'auto',
    'new_player',
    true,
    1
  ),
  (
    'characters.new.step.abilities.pointsHelp',
    'page:/characters/new',
    'Ability Point Rules',
    'At level **{{context.level}}**, you have **{{calc.abilityPointsAtLevel(level)}} Ability Points**.\nAt creation, each Ability can be between **{{rules.ABILITY_RULES.min}}** and **{{rules.ABILITY_RULES.maxStarting}}**.\nTotal negative adjustments cannot go below **{{rules.ABILITY_RULES.maxTotalNegative}}**.',
    'top',
    'auto',
    'new_player',
    true,
    1
  ),
  (
    'characters.new.step.skills.pointsHelp',
    'page:/characters/new',
    'Skill Point Rules',
    'At level **{{context.level}}**, you have **{{calc.skillPointsAtLevel(level,"character")}} Skill Points**.\nBase skill cap is **{{rules.SKILLS_AND_DEFENSES.maxSkillValue}}**.\nPast-cap cost: base **{{rules.SKILLS_AND_DEFENSES.baseSkillPastCapCost}}**, sub-skill **{{rules.SKILLS_AND_DEFENSES.subSkillPastCapCost}}**.',
    'top',
    'auto',
    'new_player',
    true,
    1
  ),
  (
    'characters.new.step.skills.subskillsHelp',
    'page:/characters/new',
    'Sub-Skills',
    'Sub-skills are **specialized skills** that build on a broader base skill (example: *Lockpicking* under *Sleight of Hand*).\nYou **can’t gain proficiency** in a sub-skill until you have proficiency in its **base skill**.\nWhen you add a sub-skill here, the base skill will be added automatically if needed.',
    'top',
    'auto',
    'new_player',
    true,
    1
  ),
  (
    'characters.new.step.archetype.pathHelp',
    'page:/characters/new',
    'Choose a Path vs Forge',
    '**Choose a Path** gives curated level 1 recommendations.\n**Forge Your Own** gives full manual customization from the start.\nBoth follow the same core progression rules.',
    'top',
    'auto',
    'new_player',
    true,
    1
  ),
  (
    'characters.new.step.archetype.powerAbilityHelp',
    'page:/characters/new',
    'Power Ability',
    'Your **Power Ability** pairs with your Power usage and best fits your character.\nIt helps determine **Energy**, your Power-related effectiveness, and **Training Points** used for crafting powers.\nCommon choices include **Acuity**, **Intelligence**, or **Charisma**.',
    'top',
    'auto',
    'new_player',
    true,
    1
  ),
  (
    'characters.new.step.archetype.martialAbilityHelp',
    'page:/characters/new',
    'Martial Ability',
    'Your **Martial Ability** reflects your combat style and approach to challenges.\nIt influences **Energy** and **Training Points** for Techniques and proficiencies.\nCommon picks include **Strength**, **Vitality**, **Agility**, or **Acuity** depending on your concept.',
    'top',
    'auto',
    'new_player',
    true,
    1
  ),
  (
    'characters.new.step.archetype.ability.strength',
    'page:/characters/new',
    'Strength',
    'Great for heavy weapons, grappling, raw force, and “front-line bruiser” builds.',
    'top',
    'hover',
    'new_player',
    true,
    1
  ),
  (
    'characters.new.step.archetype.ability.vitality',
    'page:/characters/new',
    'Vitality',
    'Fits resilient tanks, endurance-focused fighters, and characters who outlast threats.',
    'top',
    'hover',
    'new_player',
    true,
    1
  ),
  (
    'characters.new.step.archetype.ability.agility',
    'page:/characters/new',
    'Agility',
    'Good for nimble archers, evasive duelists, and precision/positioning playstyles.',
    'top',
    'hover',
    'new_player',
    true,
    1
  ),
  (
    'characters.new.step.archetype.ability.acuity',
    'page:/characters/new',
    'Acuity',
    'A focus-and-awareness stat. Works for tacticians, sharpshooters, and characters channeling power through focus/attunement.',
    'top',
    'hover',
    'new_player',
    true,
    1
  ),
  (
    'characters.new.step.archetype.ability.intelligence',
    'page:/characters/new',
    'Intelligence',
    'Ideal for scholars, inventors, and spellcasters who study and refine their craft.',
    'top',
    'hover',
    'new_player',
    true,
    1
  ),
  (
    'characters.new.step.archetype.ability.charisma',
    'page:/characters/new',
    'Charisma',
    'Fits leaders, performers, and power users who influence the world through presence and will.',
    'top',
    'hover',
    'new_player',
    true,
    1
  ),
  (
    'characters.new.overview',
    'page:/characters/new',
    'Character Creation Flow',
    'Create your character step-by-step: Archetype, Species, Ancestry, Abilities, Skills, Feats, Equipment, Powers, then Finalize.\nUse **Choose a Path** for guided picks, or **Forge Your Own** for full manual control.',
    'top',
    'auto',
    'new_player',
    true,
    1
  ),
  (
    'characters.new.step.species.sourceHelp',
    'page:/characters/new',
    'Species Sources',
    '**Public species** come from Realms content.\n**My species** are your custom species.\n**All sources** combines both lists.',
    'top',
    'auto',
    'new_player',
    true,
    1
  ),
  (
    'characters.new.step.ancestry.rulesHelp',
    'page:/characters/new',
    'Ancestry Trait Rules',
    'Default selection is **1 ancestry trait**.\nTaking a flaw grants **+1 extra ancestry trait** (for 2 total).\nIn mixed species, choose one species trait from each side before finalizing ancestry.',
    'top',
    'auto',
    'new_player',
    true,
    1
  ),
  (
    'characters.new.step.feats.selectionHelp',
    'page:/characters/new',
    'Feat Selection',
    'Pick both **Archetype Feats** and **Character Feats**.\nPath mode starts with recommended feats, but you can switch to your own picks.\nRequirement warnings show when a feat needs specific stats, skills, or other prerequisites.',
    'top',
    'auto',
    'new_player',
    true,
    1
  ),
  (
    'characters.new.step.powers.selectionHelp',
    'page:/characters/new',
    'Powers and Techniques',
    'Add powers and techniques from your library sources.\nPath mode can auto-add recommendations from your archetype path.\nIf a list is empty, create content first in the related creator pages.',
    'top',
    'auto',
    'new_player',
    true,
    1
  ),
  (
    'characters.new.step.equipment.currencyHelp',
    'page:/characters/new',
    'Starting Equipment Budget',
    'Starting currency is typically **200**.\nTrack remaining currency while adding weapons, armor, and gear.\nPath mode can add a recommended loadout in one click.',
    'top',
    'auto',
    'new_player',
    true,
    1
  ),
  (
    'characters.new.step.finalize.summaryHelp',
    'page:/characters/new',
    'Finalize Checklist',
    'Review your summary, set name/portrait, then resolve any validation warnings.\nHealth and Energy come from the allocation pool and your current ability setup.\nYou can still tune details later on the character sheet.',
    'top',
    'auto',
    'new_player',
    true,
    1
  ),
  (
    'library.page.modeHelp',
    'page:/library',
    'My vs Realms Library',
    '**Realms Library** is official shared content.\n**My Library** is your personal saved content.\nUse source filters in creators and selectors to combine **My**, **Realms**, or **All**.',
    'top',
    'auto',
    'new_player',
    true,
    1
  ),
  (
    'codex.page.modeHelp',
    'page:/codex',
    'Codex Usage',
    'The Codex is the master reference for Skills, Feats, Species, Equipment, Parts, and Properties.\nUse **Advanced** to reveal deeper rule sections for parts/properties and creature feats.',
    'top',
    'auto',
    'new_player',
    true,
    1
  ),
  (
    'campaigns.page.help',
    'page:/campaigns',
    'Campaign Flow',
    'Create a campaign as Realm Master, share the invite code, then manage party characters.\nPlayers join with a valid invite code and one of their characters.',
    'top',
    'auto',
    'new_player',
    true,
    1
  ),
  (
    'campaigns.page.inviteHelp',
    'page:/campaigns',
    'Invite and Join',
    'Invite codes are campaign-specific.\nWhen a player joins, their character visibility can be set to **Campaign** for party access.',
    'top',
    'auto',
    'new_player',
    true,
    1
  ),
  (
    'encounters.page.help',
    'page:/encounters',
    'Encounter Types',
    '**Combat:** initiative, HP, actions, and conditions.\n**Skill:** Difficulty Score (DS), successes, and failures.\n**Mixed:** both systems together with tabbed play.',
    'top',
    'auto',
    'new_player',
    true,
    1
  ),
  (
    'encounters.page.createHelp',
    'page:/encounters',
    'Creating Encounters',
    'Choose a type that matches the scene goal.\nSkill encounters commonly start near **DS = 10 + 1/2 party level** from the rulebook baseline.',
    'top',
    'auto',
    'new_player',
    true,
    1
  ),
  (
    'encounters.combat.headerHelp',
    'page:/encounters/[id]/combat',
    'Using Combat Encounters',
    'Use initiative order, action tracking, and condition handling each round.\nThis view is optimized for active turn-by-turn combat management.',
    'top',
    'auto',
    'new_player',
    true,
    1
  ),
  (
    'encounters.skill.headerHelp',
    'page:/encounters/[id]/skill',
    'Using Skill Encounters',
    'Each roll is compared to DS.\nIf roll >= DS: gain successes. If roll < DS: gain failures.\nEvery 5 points of margin adds one extra success or failure.',
    'top',
    'auto',
    'new_player',
    true,
    1
  ),
  (
    'encounters.mixed.headerHelp',
    'page:/encounters/[id]/mixed',
    'Using Mixed Encounters',
    'Swap between **Combat** and **Skill** tabs during one scene.\nUse this when tactical action and objective progress both matter.',
    'top',
    'auto',
    'new_player',
    true,
    1
  ),
  (
    'characters.sheet.help',
    'page:/characters/[id]',
    'Character Sheet Usage',
    'Use the action toolbar for edit mode, recovery, and level-up.\nLibrary and roll log sections support quick in-session play updates.\nMajor edits can be done anytime between encounters.',
    'top',
    'auto',
    'new_player',
    true,
    1
  ),
  (
    'creators.power.headerHelp',
    'page:/power-creator',
    'Power Creator',
    'Build powers from parts, then tune action type, weapon link, range, area, and duration.\nImprovised power checks in play use **DS = 10 + part TP cost total** as a baseline rulebook reference.',
    'top',
    'auto',
    'new_player',
    true,
    1
  ),
  (
    'creators.technique.headerHelp',
    'page:/technique-creator',
    'Technique Creator',
    'Set combat configuration first (weapon, action, reaction), then add technique parts.\nAdditional damage and part choices drive total Energy and TP cost.',
    'top',
    'auto',
    'new_player',
    true,
    1
  ),
  (
    'creators.empowered.headerHelp',
    'page:/empowered-technique-creator',
    'Empowered Technique Creator',
    'Empowered techniques combine power-side and technique-side construction.\nUse the shared action profile, then configure power mechanics and technique parts.',
    'top',
    'auto',
    'new_player',
    true,
    1
  ),
  (
    'creators.armament.headerHelp',
    'page:/item-creator',
    'Armament Creator',
    'Create weapons, armor, and shields by selecting item properties.\nType-specific mechanics (damage, DR, shield block, handedness, range) affect final rarity and cost.',
    'top',
    'auto',
    'new_player',
    true,
    1
  ),
  (
    'creators.creature.headerHelp',
    'page:/creature-creator',
    'Creature Creator',
    'Build creature fundamentals first: level, archetype, abilities, defenses, and resources.\nThen add feats, powers/techniques, and inventory from library sources.',
    'top',
    'auto',
    'new_player',
    true,
    1
  )
ON CONFLICT (key) DO UPDATE
SET
  scope = EXCLUDED.scope,
  title = EXCLUDED.title,
  body_md = EXCLUDED.body_md,
  placement = EXCLUDED.placement,
  trigger = EXCLUDED.trigger,
  audience = EXCLUDED.audience,
  enabled = EXCLUDED.enabled,
  version = EXCLUDED.version,
  updated_at = now();
