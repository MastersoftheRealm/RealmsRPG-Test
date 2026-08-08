/**
 * Shared character-filter persistence (TASK-680 / TASK-681).
 * Library (powers, techniques, armaments) and Codex feats share one localStorage key.
 */

export const LIBRARY_CHARACTER_FILTER_KEY = 'library:powerTechniqueCharacterFilterId';

const LEGACY_CODEX_CHARACTER_FILTER_KEY = 'codex:characterFilterId';

export function readPersistedLibraryCharacterFilterId(): string {
  if (typeof window === 'undefined') return '';
  try {
    const current = window.localStorage.getItem(LIBRARY_CHARACTER_FILTER_KEY);
    if (current) return current;
    const legacy = window.localStorage.getItem(LEGACY_CODEX_CHARACTER_FILTER_KEY);
    if (!legacy) return '';
    window.localStorage.setItem(LIBRARY_CHARACTER_FILTER_KEY, legacy);
    window.localStorage.removeItem(LEGACY_CODEX_CHARACTER_FILTER_KEY);
    return legacy;
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
