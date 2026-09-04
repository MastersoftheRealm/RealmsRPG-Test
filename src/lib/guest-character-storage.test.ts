import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { DEFAULT_ABILITIES } from '@/types/abilities';
import {
  GUEST_CHARACTER_CAP,
  GuestCharacterCapError,
  createGuestCharacter,
  deleteGuestCharacter,
  duplicateGuestCharacter,
  getGuestCharacter,
  getGuestCharactersList,
  isGuestCharacterId,
  saveGuestCharacter,
} from './guest-character-storage';

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

describe('guest-character-storage', () => {
  beforeEach(() => {
    installMemoryStorage();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('tags ids with local- prefix', () => {
    const id = createGuestCharacter({
      name: 'Aerin',
      level: 1,
      abilities: DEFAULT_ABILITIES,
    });
    expect(isGuestCharacterId(id)).toBe(true);
    expect(isGuestCharacterId('not-local')).toBe(false);
  });

  it('round-trips a finished character and list summary', () => {
    const id = createGuestCharacter({
      name: 'Aerin',
      level: 2,
      abilities: DEFAULT_ABILITIES,
      archetype: { name: 'Berserker' } as never,
      ancestry: { name: 'Human' } as never,
    });
    const stored = getGuestCharacter(id);
    expect(stored?.name).toBe('Aerin');
    expect(stored?.visibility).toBe('private');
    expect(stored?.userId).toBeUndefined();
    const list = getGuestCharactersList();
    expect(list).toHaveLength(1);
    expect(list[0]).toMatchObject({
      id,
      name: 'Aerin',
      level: 2,
      archetypeName: 'Berserker',
      ancestryName: 'Human',
    });
  });

  it('updates dirty fields without dropping identity', () => {
    const id = createGuestCharacter({
      name: 'Aerin',
      level: 1,
      abilities: DEFAULT_ABILITIES,
      currentHealth: 10,
    });
    saveGuestCharacter(id, { currentHealth: 7 });
    expect(getGuestCharacter(id)?.currentHealth).toBe(7);
    expect(getGuestCharacter(id)?.name).toBe('Aerin');
  });

  it('enforces the browser cap', () => {
    for (let i = 0; i < GUEST_CHARACTER_CAP; i += 1) {
      createGuestCharacter({ name: `Hero ${i}`, level: 1, abilities: DEFAULT_ABILITIES });
    }
    expect(() =>
      createGuestCharacter({ name: 'Overflow', level: 1, abilities: DEFAULT_ABILITIES }),
    ).toThrow(GuestCharacterCapError);
  });

  it('duplicates until the cap, then deletes', () => {
    const id = createGuestCharacter({
      name: 'Aerin',
      level: 1,
      abilities: DEFAULT_ABILITIES,
    });
    const copyId = duplicateGuestCharacter(id);
    expect(copyId).not.toBe(id);
    expect(getGuestCharacter(copyId)?.name).toBe('Aerin (Copy)');
    deleteGuestCharacter(id);
    expect(getGuestCharacter(id)).toBeNull();
    expect(getGuestCharactersList()).toHaveLength(1);
  });

  it('omits oversized data-URL portraits', () => {
    const huge = `data:image/jpeg;base64,${'A'.repeat(800 * 1024)}`;
    const id = createGuestCharacter({
      name: 'Aerin',
      level: 1,
      abilities: DEFAULT_ABILITIES,
      portrait: huge,
    });
    expect(getGuestCharacter(id)?.portrait).toBeUndefined();
  });
});
