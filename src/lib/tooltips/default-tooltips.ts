import type { TooltipRecord } from '@/types/tooltips';

function defaultTooltip(partial: Partial<TooltipRecord> & Pick<TooltipRecord, 'key' | 'scope' | 'bodyMd'>): TooltipRecord {
  return {
    id: `default-${partial.key}`,
    key: partial.key,
    scope: partial.scope,
    title: partial.title ?? null,
    bodyMd: partial.bodyMd,
    placement: partial.placement ?? 'top',
    trigger: partial.trigger ?? 'auto',
    audience: partial.audience ?? 'new_player',
    enabled: partial.enabled ?? true,
    version: partial.version ?? 1,
    updatedAt: partial.updatedAt ?? new Date(0).toISOString(),
    updatedBy: partial.updatedBy ?? null,
  };
}

export const DEFAULT_TOOLTIPS: Record<string, TooltipRecord> = {
  'global.nav.library': defaultTooltip({
    key: 'global.nav.library',
    scope: 'global:nav',
    title: 'Library',
    bodyMd:
      '**Realms Library** contains official content.\n' +
      '**My Library** is your personal saved collection.\n' +
      'Use Library to add or customize Powers, Techniques, Armaments, and Creatures.',
  }),
  'global.nav.codex': defaultTooltip({
    key: 'global.nav.codex',
    scope: 'global:nav',
    title: 'Codex',
    bodyMd:
      'The Codex is your rules and reference index for Skills, Feats, Species, Parts, and Equipment.\n' +
      'Use it while creating Characters or custom content.',
  }),
  'characters.new.step.abilities.pointsHelp': defaultTooltip({
    key: 'characters.new.step.abilities.pointsHelp',
    scope: 'page:/characters/new',
    title: 'Ability Point Rules',
    bodyMd:
      'At level **{{context.level}}**, you have **{{calc.abilityPointsAtLevel(level)}} Ability Points**.\n' +
      'At creation, each Ability can be between **{{rules.ABILITY_RULES.min}}** and **{{rules.ABILITY_RULES.maxStarting}}**.\n' +
      'Total negative adjustments cannot go below **{{rules.ABILITY_RULES.maxTotalNegative}}**.',
  }),
  'characters.new.step.skills.pointsHelp': defaultTooltip({
    key: 'characters.new.step.skills.pointsHelp',
    scope: 'page:/characters/new',
    title: 'Skill Point Rules',
    bodyMd:
      'At level **{{context.level}}**, you have **{{calc.skillPointsAtLevel(level,entityType)}} Skill Points**.\n' +
      'Base skill cap is **{{rules.SKILLS_AND_DEFENSES.maxSkillValue}}**.\n' +
      'Past-cap cost: base **{{rules.SKILLS_AND_DEFENSES.baseSkillPastCapCost}}**, sub-skill **{{rules.SKILLS_AND_DEFENSES.subSkillPastCapCost}}**.',
  }),
  'characters.new.step.skills.subskillsHelp': defaultTooltip({
    key: 'characters.new.step.skills.subskillsHelp',
    scope: 'page:/characters/new',
    title: 'Sub-Skills',
    bodyMd:
      'Sub-skills are **specialized skills** that build on a broader base skill (example: *Lockpicking* under *Sleight of Hand*).\n' +
      'You **can’t gain proficiency** in a sub-skill until you have proficiency in its **base skill**.\n' +
      'When you add a sub-skill here, the base skill will be added automatically if needed.',
  }),
  'characters.new.step.archetype.pathHelp': defaultTooltip({
    key: 'characters.new.step.archetype.pathHelp',
    scope: 'page:/characters/new',
    title: 'Choose a Path vs Forge',
    bodyMd:
      '**Choose a Path** gives curated level 1 recommendations.\n' +
      '**Forge Your Own** gives full manual customization from the start.\n' +
      'Both follow the same core progression rules.',
  }),
  'characters.new.step.archetype.powerAbilityHelp': defaultTooltip({
    key: 'characters.new.step.archetype.powerAbilityHelp',
    scope: 'page:/characters/new',
    title: 'Power Ability',
    bodyMd:
      'Your **Power Ability** pairs with your Power usage and best fits your character.\n' +
      'It helps determine **Energy**, your Power-related effectiveness, and **Training Points** used for crafting powers.\n' +
      'Common choices include **Acuity**, **Intelligence**, or **Charisma**.',
  }),
  'characters.new.step.archetype.martialAbilityHelp': defaultTooltip({
    key: 'characters.new.step.archetype.martialAbilityHelp',
    scope: 'page:/characters/new',
    title: 'Martial Ability',
    bodyMd:
      'Your **Martial Ability** reflects your combat style and approach to challenges.\n' +
      'It influences **Energy** and **Training Points** for Techniques and proficiencies.\n' +
      'Common picks include **Strength**, **Vitality**, **Agility**, or **Acuity** depending on your concept.',
  }),
  'characters.new.step.archetype.ability.strength': defaultTooltip({
    key: 'characters.new.step.archetype.ability.strength',
    scope: 'page:/characters/new',
    title: 'Strength',
    bodyMd: 'Great for heavy weapons, grappling, raw force, and “front-line bruiser” builds.',
    trigger: 'hover',
  }),
  'characters.new.step.archetype.ability.vitality': defaultTooltip({
    key: 'characters.new.step.archetype.ability.vitality',
    scope: 'page:/characters/new',
    title: 'Vitality',
    bodyMd: 'Fits resilient tanks, endurance-focused fighters, and characters who outlast threats.',
    trigger: 'hover',
  }),
  'characters.new.step.archetype.ability.agility': defaultTooltip({
    key: 'characters.new.step.archetype.ability.agility',
    scope: 'page:/characters/new',
    title: 'Agility',
    bodyMd: 'Good for nimble archers, evasive duelists, and precision/positioning playstyles.',
    trigger: 'hover',
  }),
  'characters.new.step.archetype.ability.acuity': defaultTooltip({
    key: 'characters.new.step.archetype.ability.acuity',
    scope: 'page:/characters/new',
    title: 'Acuity',
    bodyMd:
      'A focus-and-awareness stat. Works for tacticians, sharpshooters, and characters channeling power through focus/attunement.',
    trigger: 'hover',
  }),
  'characters.new.step.archetype.ability.intelligence': defaultTooltip({
    key: 'characters.new.step.archetype.ability.intelligence',
    scope: 'page:/characters/new',
    title: 'Intelligence',
    bodyMd: 'Ideal for scholars, inventors, and spellcasters who study and refine their craft.',
    trigger: 'hover',
  }),
  'characters.new.step.archetype.ability.charisma': defaultTooltip({
    key: 'characters.new.step.archetype.ability.charisma',
    scope: 'page:/characters/new',
    title: 'Charisma',
    bodyMd: 'Fits leaders, performers, and power users who influence the world through presence and will.',
    trigger: 'hover',
  }),
  'characters.new.overview': defaultTooltip({
    key: 'characters.new.overview',
    scope: 'page:/characters/new',
    title: 'Character Creation Flow',
    bodyMd:
      'Create your character step-by-step: Archetype, Species, Ancestry, Abilities, Skills, Feats, Equipment, Powers, then Finalize.\n' +
      'Use **Choose a Path** for guided picks, or **Forge Your Own** for full manual control.',
  }),
  'characters.new.step.species.sourceHelp': defaultTooltip({
    key: 'characters.new.step.species.sourceHelp',
    scope: 'page:/characters/new',
    title: 'Species Sources',
    bodyMd:
      '**Public species** come from Realms content.\n' +
      '**My species** are your custom species.\n' +
      '**All sources** combines both lists.',
  }),
  'characters.new.step.ancestry.rulesHelp': defaultTooltip({
    key: 'characters.new.step.ancestry.rulesHelp',
    scope: 'page:/characters/new',
    title: 'Ancestry Trait Rules',
    bodyMd:
      'Default selection is **1 ancestry trait**.\n' +
      'Taking a flaw grants **+1 extra ancestry trait** (for 2 total).\n' +
      'In mixed species, choose one species trait from each side before finalizing ancestry.',
  }),
  'characters.new.step.feats.selectionHelp': defaultTooltip({
    key: 'characters.new.step.feats.selectionHelp',
    scope: 'page:/characters/new',
    title: 'Feat Selection',
    bodyMd:
      'Pick both **Archetype Feats** and **Character Feats**.\n' +
      'Path mode starts with recommended feats, but you can switch to your own picks.\n' +
      'Requirement warnings show when a feat needs specific stats, skills, or other prerequisites.',
  }),
  'characters.new.step.powers.selectionHelp': defaultTooltip({
    key: 'characters.new.step.powers.selectionHelp',
    scope: 'page:/characters/new',
    title: 'Powers and Techniques',
    bodyMd:
      'Add powers and techniques from your library sources.\n' +
      'Path mode can auto-add recommendations from your archetype path.\n' +
      'If a list is empty, create content first in the related creator pages.',
  }),
  'characters.new.step.equipment.currencyHelp': defaultTooltip({
    key: 'characters.new.step.equipment.currencyHelp',
    scope: 'page:/characters/new',
    title: 'Starting Equipment Budget',
    bodyMd:
      'Starting currency is typically **200**.\n' +
      'Track remaining currency while adding weapons, armor, and gear.\n' +
      'Path mode can add a recommended loadout in one click.',
  }),
  'characters.new.step.finalize.summaryHelp': defaultTooltip({
    key: 'characters.new.step.finalize.summaryHelp',
    scope: 'page:/characters/new',
    title: 'Finalize Checklist',
    bodyMd:
      'Review your summary, set name/portrait, then resolve any validation warnings.\n' +
      'Health and Energy come from the allocation pool and your current ability setup.\n' +
      'You can still tune details later on the character sheet.',
  }),
  'library.page.modeHelp': defaultTooltip({
    key: 'library.page.modeHelp',
    scope: 'page:/library',
    title: 'My vs Realms Library',
    bodyMd:
      '**Realms Library** is official shared content.\n' +
      '**My Library** is your personal saved content.\n' +
      'Use source filters in creators and selectors to combine **My**, **Realms**, or **All**.',
  }),
  'codex.page.modeHelp': defaultTooltip({
    key: 'codex.page.modeHelp',
    scope: 'page:/codex',
    title: 'Codex Usage',
    bodyMd:
      'The Codex is the master reference for Skills, Feats, Species, Equipment, Parts, and Properties.\n' +
      'Use **Advanced** to reveal deeper rule sections for parts/properties and creature feats.',
  }),
  'campaigns.page.help': defaultTooltip({
    key: 'campaigns.page.help',
    scope: 'page:/campaigns',
    title: 'Campaign Flow',
    bodyMd:
      'Create a campaign as Realm Master, share the invite code, then manage party characters.\n' +
      'Players join with a valid invite code and one of their characters.',
  }),
  'campaigns.page.inviteHelp': defaultTooltip({
    key: 'campaigns.page.inviteHelp',
    scope: 'page:/campaigns',
    title: 'Invite and Join',
    bodyMd:
      'Invite codes are campaign-specific.\n' +
      'When a player joins, their character visibility can be set to **Campaign** for party access.',
  }),
  'encounters.page.help': defaultTooltip({
    key: 'encounters.page.help',
    scope: 'page:/encounters',
    title: 'Encounter Types',
    bodyMd:
      '**Combat:** initiative, HP, actions, and conditions.\n' +
      '**Skill:** Difficulty Score (DS), successes, and failures.\n' +
      '**Mixed:** both systems together with tabbed play.',
  }),
  'encounters.page.createHelp': defaultTooltip({
    key: 'encounters.page.createHelp',
    scope: 'page:/encounters',
    title: 'Creating Encounters',
    bodyMd:
      'Choose a type that matches the scene goal.\n' +
      'Skill encounters commonly start near **DS = 10 + 1/2 party level** from the rulebook baseline.',
  }),
  'encounters.combat.headerHelp': defaultTooltip({
    key: 'encounters.combat.headerHelp',
    scope: 'page:/encounters/[id]/combat',
    title: 'Using Combat Encounters',
    bodyMd:
      'Use initiative order, action tracking, and condition handling each round.\n' +
      'This view is optimized for active turn-by-turn combat management.',
  }),
  'encounters.skill.headerHelp': defaultTooltip({
    key: 'encounters.skill.headerHelp',
    scope: 'page:/encounters/[id]/skill',
    title: 'Using Skill Encounters',
    bodyMd:
      'Each roll is compared to DS.\n' +
      'If roll >= DS: gain successes. If roll < DS: gain failures.\n' +
      'Every 5 points of margin adds one extra success or failure.',
  }),
  'encounters.mixed.headerHelp': defaultTooltip({
    key: 'encounters.mixed.headerHelp',
    scope: 'page:/encounters/[id]/mixed',
    title: 'Using Mixed Encounters',
    bodyMd:
      'Swap between **Combat** and **Skill** tabs during one scene.\n' +
      'Use this when tactical action and objective progress both matter.',
  }),
  'characters.sheet.help': defaultTooltip({
    key: 'characters.sheet.help',
    scope: 'page:/characters/[id]',
    title: 'Character Sheet Usage',
    bodyMd:
      'Use the action toolbar for edit mode, recovery, and level-up.\n' +
      'Library and roll log sections support quick in-session play updates.\n' +
      'Major edits can be done anytime between encounters.',
  }),
  'creators.power.headerHelp': defaultTooltip({
    key: 'creators.power.headerHelp',
    scope: 'page:/power-creator',
    title: 'Power Creator',
    bodyMd:
      'Build powers from parts, then tune action type, weapon link, range, area, and duration.\n' +
      'Improvised power checks in play use **DS = 10 + part TP cost total** as a baseline rulebook reference.',
  }),
  'creators.technique.headerHelp': defaultTooltip({
    key: 'creators.technique.headerHelp',
    scope: 'page:/technique-creator',
    title: 'Technique Creator',
    bodyMd:
      'Set combat configuration first (weapon, action, reaction), then add technique parts.\n' +
      'Additional damage and part choices drive total Energy and TP cost.',
  }),
  'creators.empowered.headerHelp': defaultTooltip({
    key: 'creators.empowered.headerHelp',
    scope: 'page:/empowered-technique-creator',
    title: 'Empowered Technique Creator',
    bodyMd:
      'Empowered techniques combine power-side and technique-side construction.\n' +
      'Use the shared action profile, then configure power mechanics and technique parts.',
  }),
  'creators.armament.headerHelp': defaultTooltip({
    key: 'creators.armament.headerHelp',
    scope: 'page:/item-creator',
    title: 'Armament Creator',
    bodyMd:
      'Create weapons, armor, and shields by selecting item properties.\n' +
      'Type-specific mechanics (damage, DR, shield block, handedness, range) affect final rarity and cost.',
  }),
  'creators.creature.headerHelp': defaultTooltip({
    key: 'creators.creature.headerHelp',
    scope: 'page:/creature-creator',
    title: 'Creature Creator',
    bodyMd:
      'Build creature fundamentals first: level, archetype, abilities, defenses, and resources.\n' +
      'Then add feats, powers/techniques, and inventory from library sources.',
  }),
};

export function getDefaultTooltipByKey(key: string): TooltipRecord | undefined {
  return DEFAULT_TOOLTIPS[key];
}
