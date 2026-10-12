import type { Character } from '@/types';
import { calculateArchetypeProgression } from '@/lib/game/formulas';
import { GUIDED_CREATOR_COPY } from '@/lib/constants/site-copy';

const ptCopy = GUIDED_CREATOR_COPY.steps.powersTechniques;

/** Sheet warning when a power is marked innate but the path has no Innate Energy. */
export const SHEET_INNATE_NOT_ALLOWED_WARNING =
  'This path has no innate powers (Innate Energy is 0).';

/** Warn-only copy when an innate power exceeds Innate Threshold (86e3pbwf2). */
export const INNATE_THRESHOLD_WARNING = ptCopy.innateThresholdBlocked;

/** Warn-only copy when innate powers total exceeds Innate Energy (86e3pbwf2). */
export const INNATE_ENERGY_TOTAL_WARNING = ptCopy.innateEnergyBlocked;

export function isInnatePowerOverThreshold(
  energy: number | undefined,
  innateThreshold: number,
): boolean {
  if (innateThreshold <= 0) return false;
  if (energy == null || energy < 0) return true;
  return energy > innateThreshold;
}

export function sumInnatePowerEnergies(energies: number[]): number {
  return energies.reduce((sum, energy) => sum + (energy > 0 ? energy : 0), 0);
}

export function isInnateEnergyTotalOverBudget(
  innateEnergyMax: number,
  innatePowerEnergies: number[],
): boolean {
  if (innateEnergyMax <= 0) return false;
  return sumInnatePowerEnergies(innatePowerEnergies) > innateEnergyMax;
}

export function resolveCharacterInnateEnergy(character: Character): number {
  const progression = calculateArchetypeProgression(
    character.level || 1,
    character.mart_prof || 0,
    character.pow_prof || 0,
    character.archetypeChoices || {},
  );
  return progression.innateEnergy;
}

export function characterSupportsInnatePowers(character: Character): boolean {
  return resolveCharacterInnateEnergy(character) > 0;
}

export function resolveCharacterInnateThreshold(character: Character): number {
  const progression = calculateArchetypeProgression(
    character.level || 1,
    character.mart_prof || 0,
    character.pow_prof || 0,
    character.archetypeChoices || {},
  );
  return progression.innateThreshold;
}
