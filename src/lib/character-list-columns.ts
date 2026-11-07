/** Character-list visibility helpers. */

import type { CharacterVisibility } from '@/types';

const VISIBILITY_VALUES: readonly CharacterVisibility[] = ['private', 'campaign', 'public'];

function asVisibility(value: unknown): CharacterVisibility | null {
  return typeof value === 'string' && (VISIBILITY_VALUES as readonly string[]).includes(value)
    ? (value as CharacterVisibility)
    : null;
}

/** `characters.visibility` is the sole list/read authority after ADR-0031. */
export function resolveCharacterVisibility(row: {
  visibility?: string | null | undefined;
}): CharacterVisibility {
  return asVisibility(row.visibility) ?? 'private';
}
