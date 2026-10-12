import type { Character } from '@/types';
import { calculateArchetypeProgression } from '@/lib/game/formulas';

/** Sheet warning when a power is marked innate but the path has no Innate Energy. */
export const SHEET_INNATE_NOT_ALLOWED_WARNING =
  'This path has no innate powers (Innate Energy is 0).';

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
