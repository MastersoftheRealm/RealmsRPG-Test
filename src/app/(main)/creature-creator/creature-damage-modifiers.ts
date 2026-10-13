import type { CreatureState } from './creature-creator-types';

export type DamageModifierLists = Pick<CreatureState, 'resistances' | 'weaknesses' | 'immunities'>;

/** Damage types already used as a resistance, weakness, or immunity. */
export function takenDamageModifiers(creature: DamageModifierLists): string[] {
  return [...creature.resistances, ...creature.weaknesses, ...creature.immunities];
}

/**
 * A type cannot be a weakness and also a resistance or immunity.
 * The same type also cannot be added twice, or as both a resistance and an immunity.
 */
export function canAddDamageModifier(creature: DamageModifierLists, item: string): boolean {
  return !takenDamageModifiers(creature).includes(item);
}
