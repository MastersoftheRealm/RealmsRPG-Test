/**
 * Maps removed DB tooltip keys (PR #14 / `ContextHelpTooltip`) to current
 * `public/tooltip-text.tsx` exports. For onboarding and grep-driven migrations only.
 */

export const LEGACY_TOOLTIP_KEY_MAP = {
  'global.nav.library': 'navbarLibrary',
  'global.nav.codex': 'navbarCodex',
  'characters.new.step.abilities.pointsHelp': 'getAbilityPointsHelp',
  'characters.new.step.archetype.pathHelp': 'createNewCharacter',
  'characters.new.step.archetype.powerAbilityHelp': 'powerAbility',
  'characters.new.step.archetype.martialAbilityHelp': 'martialAbility',
  'characters.new.step.skills.pointsHelp': 'getSkillPointsHelp',
  'characters.new.step.skills.subskillsHelp': 'subSkillsHelp',
} as const;

export type LegacyTooltipKey = keyof typeof LEGACY_TOOLTIP_KEY_MAP;

/** Dynamic keys from PR #14 archetype ability buttons: `characters.new.step.archetype.ability.${ability}` */
export const LEGACY_ARCHETYPE_ABILITY_KEY_PREFIX = 'characters.new.step.archetype.ability.' as const;

export function resolveLegacyArchetypeAbilityExport(ability: string): 'getTooltipTextByPowerAbility' {
  void ability;
  return 'getTooltipTextByPowerAbility';
}
