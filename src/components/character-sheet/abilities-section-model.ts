import { cn } from '@/lib/utils';
import type { Abilities, AbilityName, DefenseSkills } from '@/types';

export const ABILITY_ORDER: AbilityName[] = ['strength', 'vitality', 'agility', 'acuity', 'intelligence', 'charisma'];

/** Sheet tip touch: hug on desktop; 44px below md (overrides WordHelpTip default min size). */
const SHEET_TIP_TOUCH_CLASS =
  'min-h-0 min-w-0 max-md:min-h-[var(--touch-target-min,44px)] max-md:min-w-[var(--touch-target-min,44px)]';

/** Sheet tip: defense/ability name labels. */
export const SHEET_STAT_TIP_CLASS = cn(
  'text-sm font-semibold uppercase tracking-wide text-text-secondary text-center leading-none px-0.5',
  SHEET_TIP_TOUCH_CLASS
);

/** Defense Score value tip — keep large glance number. */
export const SHEET_SCORE_TIP_CLASS = cn(
  'text-2xl font-bold leading-none tabular-nums',
  SHEET_TIP_TOUCH_CLASS
);

/** Shared tile chrome — breathing room without tall empty cards. */
export const SHEET_STAT_TILE_CLASS =
  'flex flex-col items-center justify-center gap-2 px-2.5 py-3 rounded-xl border';

export const ABILITY_INFO: Record<AbilityName, { name: string; shortName: string; defenseKey: keyof DefenseSkills }> = {
  strength: { name: 'Strength', shortName: 'STR', defenseKey: 'might' },
  vitality: { name: 'Vitality', shortName: 'VIT', defenseKey: 'fortitude' },
  agility: { name: 'Agility', shortName: 'AGI', defenseKey: 'reflex' },
  acuity: { name: 'Acuity', shortName: 'ACU', defenseKey: 'discernment' },
  intelligence: { name: 'Intelligence', shortName: 'INT', defenseKey: 'mentalFortitude' },
  charisma: { name: 'Charisma', shortName: 'CHA', defenseKey: 'resolve' },
};

export const DEFENSE_INFO: Record<keyof DefenseSkills, { name: string; shortName: string }> = {
  might: { name: 'Might', shortName: 'MGT' },
  fortitude: { name: 'Fortitude', shortName: 'FOR' },
  reflex: { name: 'Reflex', shortName: 'REF' },
  discernment: { name: 'Discernment', shortName: 'DIS' },
  mentalFortitude: { name: 'Mental Fort.', shortName: 'MNT' },
  resolve: { name: 'Resolve', shortName: 'RES' },
};

// Ability constraints
export const ABILITY_CONSTRAINTS = {
  /** Level-1 creation minimum; sheet editing can go lower for effects. */
  MIN_ABILITY: -2,
  /** Floor when editing on character sheet (effects may reduce below -2). */
  MIN_ABILITY_SHEET_EDIT: -10,
  MAX_NEGATIVE_SUM: -3,
  getMaxAbility: (level: number): number => {
    if (level <= 1) return 3;
    if (level <= 3) return 4;
    if (level <= 6) return 5;
    if (level <= 9) return 6;
    if (level <= 12) return 7;
    if (level <= 15) return 8;
    return 9;
  },
  getMaxDefenseSkill: (level: number): number => level,
};

export function canDecreaseAbility(abilities: Abilities, abilityName: AbilityName): boolean {
  const currentValue = abilities[abilityName] ?? 0;
  const newValue = currentValue - 1;

  // Sheet editing: allow down to MIN_ABILITY_SHEET_EDIT so effects can reduce below level-1 minimum (-2)
  if (newValue < ABILITY_CONSTRAINTS.MIN_ABILITY_SHEET_EDIT) return false;

  // When going below creation minimum (-2), only enforce the sheet floor; skip negative-sum rule
  if (newValue < ABILITY_CONSTRAINTS.MIN_ABILITY) return true;

  // Check negative sum constraint (creation rule for values >= -2)
  if (newValue < 0) {
    const currentNegSum = Object.values(abilities)
      .filter((v): v is number => typeof v === 'number' && v < 0)
      .reduce((sum, v) => sum + v, 0);

    let newNegSum: number;
    if (currentValue < 0) {
      newNegSum = currentNegSum - 1;
    } else {
      newNegSum = currentNegSum + newValue;
    }

    if (newNegSum < ABILITY_CONSTRAINTS.MAX_NEGATIVE_SUM) return false;
  }

  return true;
}
