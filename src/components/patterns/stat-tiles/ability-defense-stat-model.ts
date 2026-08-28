import { DEFENSE_DISPLAY_NAMES } from '@/lib/game/constants';
import { cn } from '@/lib/utils';
import type { Abilities, AbilityName, DefenseSkills } from '@/types';

export const ABILITY_ORDER: AbilityName[] = [
  'strength',
  'vitality',
  'agility',
  'acuity',
  'intelligence',
  'charisma',
];

/** Sheet tip touch: hug on fine pointer; Standard min-h (no min-w) on coarse — ADR-0023. */
const SHEET_TIP_TOUCH_CLASS =
  'min-h-0 min-w-0 [@media(pointer:coarse)]:min-h-[var(--touch-target-min,44px)]';

/** Sheet tip: defense/ability name labels. Full GAME_RULES words; wrap inside the tile (C2). */
export const SHEET_STAT_TIP_CLASS = cn(
  'flex w-full min-w-0 self-stretch flex-col items-center justify-center',
  'min-h-[2.5em] px-0.5 text-center text-sm font-semibold uppercase leading-tight tracking-wide',
  'text-text-secondary whitespace-normal',
  SHEET_TIP_TOUCH_CLASS,
);

/** Defense Score value tip — keep large glance number. */
export const SHEET_SCORE_TIP_CLASS = cn(
  'text-2xl font-bold leading-none tabular-nums',
  SHEET_TIP_TOUCH_CLASS,
);

/** Shared tile chrome — label glued to value; row siblings share height via grid stretch. */
export const SHEET_STAT_TILE_CLASS =
  'flex h-full min-w-0 flex-col items-center justify-start gap-2 px-2.5 py-3 rounded-xl border';

/** C3/C5: full names fit at 2-col phone / 3-col sm / 6-col lg (same tracks as AbilityScoreGrid). */
export const SHEET_STAT_GRID_CLASS =
  'grid min-w-0 grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-6 md:gap-3';

export const ABILITY_INFO: Record<
  AbilityName,
  { name: string; shortName: string; defenseKey: keyof DefenseSkills }
> = {
  strength: { name: 'Strength', shortName: 'STR', defenseKey: 'might' },
  vitality: { name: 'Vitality', shortName: 'VIT', defenseKey: 'fortitude' },
  agility: { name: 'Agility', shortName: 'AGI', defenseKey: 'reflex' },
  acuity: { name: 'Acuity', shortName: 'ACU', defenseKey: 'discernment' },
  intelligence: { name: 'Intelligence', shortName: 'INT', defenseKey: 'mentalFortitude' },
  charisma: { name: 'Charisma', shortName: 'CHA', defenseKey: 'resolve' },
};

export const DEFENSE_INFO: Record<keyof DefenseSkills, { name: string; shortName: string }> = {
  might: { name: DEFENSE_DISPLAY_NAMES.might, shortName: 'MGT' },
  fortitude: { name: DEFENSE_DISPLAY_NAMES.fortitude, shortName: 'FOR' },
  reflex: { name: DEFENSE_DISPLAY_NAMES.reflex, shortName: 'REF' },
  discernment: { name: DEFENSE_DISPLAY_NAMES.discernment, shortName: 'DIS' },
  mentalFortitude: { name: DEFENSE_DISPLAY_NAMES.mentalFortitude, shortName: 'MNT' },
  resolve: { name: DEFENSE_DISPLAY_NAMES.resolve, shortName: 'RES' },
};

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

  if (newValue < ABILITY_CONSTRAINTS.MIN_ABILITY_SHEET_EDIT) return false;
  if (newValue < ABILITY_CONSTRAINTS.MIN_ABILITY) return true;

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
