import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  LIBRARY_CHARACTER_FILTER_KEY,
  readInitialLibraryCharacterFilterId,
  readPersistedLibraryCharacterFilterId,
  writePersistedLibraryCharacterFilterId,
} from './character-filter-persistence';

function installMemoryStorage() {
  const store = new Map<string, string>();
  const memory: Storage = {
    get length() {
      return store.size;
    },
    clear: () => store.clear(),
    getItem: (key) => (store.has(key) ? store.get(key)! : null),
    key: (index) => Array.from(store.keys())[index] ?? null,
    removeItem: (key) => {
      store.delete(key);
    },
    setItem: (key, value) => {
      store.set(key, String(value));
    },
  };
  Object.defineProperty(globalThis, 'localStorage', {
    value: memory,
    configurable: true,
    writable: true,
  });
  Object.defineProperty(globalThis, 'window', {
    value: globalThis,
    configurable: true,
    writable: true,
  });
}

describe('character-filter-persistence', () => {
  beforeEach(() => {
    installMemoryStorage();
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('reads and writes the shared library character filter key', () => {
    expect(readPersistedLibraryCharacterFilterId()).toBe('');
    writePersistedLibraryCharacterFilterId('char-1');
    expect(localStorage.getItem(LIBRARY_CHARACTER_FILTER_KEY)).toBe('char-1');
    expect(readPersistedLibraryCharacterFilterId()).toBe('char-1');
    writePersistedLibraryCharacterFilterId('');
    expect(readPersistedLibraryCharacterFilterId()).toBe('');
  });

  it('readInitial respects persist flag', () => {
    writePersistedLibraryCharacterFilterId('char-2');
    expect(readInitialLibraryCharacterFilterId(true)).toBe('char-2');
    expect(readInitialLibraryCharacterFilterId(false)).toBe('');
  });
});
