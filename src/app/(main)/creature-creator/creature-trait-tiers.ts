/**
 * Tiered creature senses and movement. A higher option replaces the lower ones
 * in the same family so feat-point costs do not stack.
 */

export const TIERED_CREATURE_TRAIT_FAMILIES: readonly (readonly string[])[] = [
  ['Darkvision', 'Darkvision II', 'Darkvision III'],
  ['Blindsense', 'Blindsense II', 'Blindsense III'],
  ['Telepathy', 'Telepathy II'],
  ['Fly Half', 'Fly'],
  ['Burrow', 'Burrow II'],
  ['Jump', 'Jump II', 'Jump III'],
  ['Speedy', 'Speedy II', 'Speedy III'],
];

export function replaceTieredCreatureTrait(existing: readonly string[], next: string): string[] {
  const family = TIERED_CREATURE_TRAIT_FAMILIES.find((group) => group.includes(next));
  if (!family) {
    return existing.includes(next) ? [...existing] : [...existing, next];
  }
  return [...existing.filter((item) => !family.includes(item)), next];
}
