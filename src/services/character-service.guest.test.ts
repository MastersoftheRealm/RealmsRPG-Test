import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DEFAULT_ABILITIES } from '@/types/abilities';
import { createGuestCharacter, isGuestCharacterId } from '@/lib/guest-character-storage';
import {
  deleteCharacter,
  duplicateCharacter,
  getCharacter,
  saveCharacter,
  saveCharacterWithConflictRetry,
} from './character-service';

const apiFetch = vi.hoisted(() => vi.fn());
const apiFetchOrNull = vi.hoisted(() => vi.fn());

vi.mock('@/lib/api-client', () => ({
  apiFetch: (...args: unknown[]) => apiFetch(...args),
  apiFetchOrNull: (...args: unknown[]) => apiFetchOrNull(...args),
  isConflictError: () => false,
}));

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

describe('character-service guest local- ids', () => {
  beforeEach(() => {
    installMemoryStorage();
    apiFetch.mockReset();
    apiFetchOrNull.mockReset();
  });

  it('loads, patches, and duplicates without hitting the characters API', async () => {
    const id = createGuestCharacter({
      name: 'Aerin',
      level: 1,
      abilities: DEFAULT_ABILITIES,
      currentHealth: 8,
    });
    expect(isGuestCharacterId(id)).toBe(true);

    const loaded = await getCharacter(id);
    expect(loaded.character?.name).toBe('Aerin');
    expect(apiFetchOrNull).not.toHaveBeenCalled();

    await saveCharacter(id, { currentHealth: 3 });
    expect(apiFetch).not.toHaveBeenCalled();
    expect((await getCharacter(id)).character?.currentHealth).toBe(3);

    const retry = await saveCharacterWithConflictRetry(
      id,
      { notes: 'local' },
      { mergeOnConflict: () => ({ dirty: {} }) },
    );
    expect(retry.applied).toEqual({ notes: 'local' });
    expect(apiFetch).not.toHaveBeenCalled();

    const copyId = await duplicateCharacter(id);
    expect(isGuestCharacterId(copyId)).toBe(true);
    expect(apiFetch).not.toHaveBeenCalled();

    await deleteCharacter(copyId);
    expect(apiFetch).not.toHaveBeenCalled();
    expect((await getCharacter(copyId)).character).toBeNull();
  });
});
