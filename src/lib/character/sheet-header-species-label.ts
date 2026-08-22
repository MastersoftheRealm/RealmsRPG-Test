import type { Character } from '@/types';

/** Species line under the character name on the sheet header. */
export function resolveSheetHeaderSpeciesLabel(character: Character): string {
  const ancestry = character.ancestry;
  if (ancestry?.mixed === true) {
    const [nameA, nameB] = ancestry.speciesNames ?? [];
    if (nameA && nameB) {
      return `${nameA} / ${nameB}`;
    }
    if (ancestry.name) {
      return ancestry.name;
    }
  }

  return ancestry?.name || character.species || 'Unknown';
}

export function isMixedSpeciesHeaderLine(character: Character): boolean {
  return character.ancestry?.mixed === true;
}
