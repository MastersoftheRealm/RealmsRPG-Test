/**
 * Shared Library character-filter persistence (TASK-680 / TASK-681).
 * Powers, techniques, and armaments read/write the same localStorage key.
 */

/** localStorage key for Library browse character filter (powers/techniques/armaments). */
export const LIBRARY_CHARACTER_FILTER_KEY = 'library:powerTechniqueCharacterFilterId';

/** @deprecated Use LIBRARY_CHARACTER_FILTER_KEY */
export const LIBRARY_PT_CHARACTER_FILTER_KEY = LIBRARY_CHARACTER_FILTER_KEY;

export function readPersistedLibraryCharacterFilterId(): string {
  if (typeof window === 'undefined') return '';
  try {
    return window.localStorage.getItem(LIBRARY_CHARACTER_FILTER_KEY) ?? '';
  } catch {
    return '';
  }
}

export function writePersistedLibraryCharacterFilterId(characterId: string): void {
  if (typeof window === 'undefined') return;
  try {
    if (characterId) {
      window.localStorage.setItem(LIBRARY_CHARACTER_FILTER_KEY, characterId);
    } else {
      window.localStorage.removeItem(LIBRARY_CHARACTER_FILTER_KEY);
    }
  } catch {
    // ignore quota / private mode
  }
}

export function readInitialLibraryCharacterFilterId(persist: boolean): string {
  return persist ? readPersistedLibraryCharacterFilterId() : '';
}
