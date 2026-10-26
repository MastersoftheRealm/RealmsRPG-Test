/**
 * Autosave dirty detection for character sheets — ignores server metadata and
 * normalizes library visibility prefs so sparse vs expanded objects match.
 */

import type { Character } from '@/types';
import { compactLibrarySectionVisibility } from '@/lib/character-library-section-visibility';

const AUTOSAVE_META_KEYS = ['updatedAt', 'lastPlayedAt'] as const;

function stripAutosaveMeta<T extends Record<string, unknown>>(doc: T): T {
  const next = { ...doc };
  for (const key of AUTOSAVE_META_KEYS) {
    delete next[key];
  }
  return next;
}

function normalizeLibraryPrefs(character: Character): Character {
  const section = compactLibrarySectionVisibility(character.librarySectionVisibility);
  const next: Character = { ...character };
  if (section === undefined) delete next.librarySectionVisibility;
  else next.librarySectionVisibility = section;
  return next;
}

/** True when two in-memory characters represent the same saved document. */
export function characterAutosaveDocumentsEqual(
  a: Character | null | undefined,
  b: Character | null | undefined,
): boolean {
  if (a === b) return true;
  if (!a || !b) return false;
  const left = stripAutosaveMeta(normalizeLibraryPrefs(a) as Record<string, unknown>);
  const right = stripAutosaveMeta(normalizeLibraryPrefs(b) as Record<string, unknown>);
  return JSON.stringify(left) === JSON.stringify(right);
}
