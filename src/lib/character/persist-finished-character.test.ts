import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DEFAULT_ABILITIES } from '@/types/abilities';
import { isGuestCharacterId } from '@/lib/guest-character-storage';
import { persistFinishedCharacter } from './persist-finished-character';

const createCharacter = vi.hoisted(() => vi.fn());
const saveCharacter = vi.hoisted(() => vi.fn());

vi.mock('@/services/character-service', () => ({
  createCharacter: (...args: unknown[]) => createCharacter(...args),
  saveCharacter: (...args: unknown[]) => saveCharacter(...args),
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

describe('persistFinishedCharacter', () => {
  beforeEach(() => {
    installMemoryStorage();
    createCharacter.mockReset();
    saveCharacter.mockReset();
  });

  it('writes a local- id without calling the characters API when unsigned', async () => {
    const result = await persistFinishedCharacter({
      lean: { name: 'Aerin', level: 1, abilities: DEFAULT_ABILITIES },
      userId: null,
    });
    expect(result.mode).toBe('local');
    expect(isGuestCharacterId(result.id)).toBe(true);
    expect(createCharacter).not.toHaveBeenCalled();
    expect(saveCharacter).not.toHaveBeenCalled();
  });
});
