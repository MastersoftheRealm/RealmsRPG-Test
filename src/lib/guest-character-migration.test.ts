import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DEFAULT_ABILITIES } from '@/types/abilities';
import {
  createGuestCharacter,
  getGuestCharacter,
  getGuestCharactersList,
} from './guest-character-storage';

const createCharacter = vi.hoisted(() => vi.fn());
const saveCharacter = vi.hoisted(() => vi.fn());
const uploadCharacterPortraitFromDataUrl = vi.hoisted(() => vi.fn());

vi.mock('@/services/character-service', () => ({
  createCharacter: (...args: unknown[]) => createCharacter(...args),
  saveCharacter: (...args: unknown[]) => saveCharacter(...args),
}));

vi.mock('@/lib/portrait', () => ({
  uploadCharacterPortraitFromDataUrl: (...args: unknown[]) =>
    uploadCharacterPortraitFromDataUrl(...args),
}));

vi.mock('@/lib/api-client', () => ({
  logClientError: vi.fn(),
}));

import { migrateGuestCharactersOnSignIn } from './guest-character-migration';

function installMemoryStorage() {
  const local = new Map<string, string>();
  const session = new Map<string, string>();
  const make = (store: Map<string, string>): Storage => ({
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
  });
  Object.defineProperty(globalThis, 'localStorage', {
    value: make(local),
    configurable: true,
    writable: true,
  });
  Object.defineProperty(globalThis, 'sessionStorage', {
    value: make(session),
    configurable: true,
    writable: true,
  });
  Object.defineProperty(globalThis, 'window', {
    value: globalThis,
    configurable: true,
    writable: true,
  });
}

describe('guest character sign-in migration (86e3jmw1m)', () => {
  beforeEach(() => {
    installMemoryStorage();
    createCharacter.mockReset();
    saveCharacter.mockReset();
    uploadCharacterPortraitFromDataUrl.mockReset();
  });

  it('imports one guest character once when sign-in starts many migrations together', async () => {
    const localId = createGuestCharacter({
      name: 'S4 guest route 3',
      level: 1,
      abilities: DEFAULT_ABILITIES,
    });
    let resolveCreate: (id: string) => void = () => {};
    createCharacter.mockImplementation(
      () =>
        new Promise<string>((resolve) => {
          resolveCreate = resolve;
        }),
    );

    const pending = Promise.all(Array.from({ length: 10 }, () => migrateGuestCharactersOnSignIn()));

    expect(createCharacter).toHaveBeenCalledTimes(1);
    expect(createCharacter).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'S4 guest route 3' }),
      { clientRequestId: localId.slice('local-'.length) },
    );
    expect(createCharacter.mock.calls[0]?.[0]).not.toHaveProperty('id');

    resolveCreate('server-character');
    const counts = await pending;

    expect(createCharacter).toHaveBeenCalledTimes(1);
    expect(counts).toEqual(Array.from({ length: 10 }, () => 1));
    expect(getGuestCharactersList()).toHaveLength(0);
    expect(getGuestCharacter(localId)).toBeNull();

    createCharacter.mockClear();
    await expect(migrateGuestCharactersOnSignIn()).resolves.toBe(0);
    expect(createCharacter).not.toHaveBeenCalled();
  });

  it('creates the next guest character only after the previous create settles', async () => {
    createGuestCharacter({ name: 'First', level: 1, abilities: DEFAULT_ABILITIES });
    createGuestCharacter({ name: 'Second', level: 1, abilities: DEFAULT_ABILITIES });
    const resolvers: Array<(id: string) => void> = [];
    createCharacter.mockImplementation(
      () =>
        new Promise<string>((resolve) => {
          resolvers.push(resolve);
        }),
    );

    const pending = Promise.all([
      migrateGuestCharactersOnSignIn(),
      migrateGuestCharactersOnSignIn(),
    ]);

    expect(createCharacter).toHaveBeenCalledTimes(1);
    expect(createCharacter.mock.calls[0]?.[0]).toMatchObject({ name: 'Second' });

    resolvers[0]?.('server-1');
    await vi.waitFor(() => expect(createCharacter).toHaveBeenCalledTimes(2));
    expect(createCharacter.mock.calls[1]?.[0]).toMatchObject({ name: 'First' });

    resolvers[1]?.('server-2');
    await pending;
    expect(createCharacter).toHaveBeenCalledTimes(2);
    expect(getGuestCharactersList()).toHaveLength(0);
  });

  it('keeps the guest character when create fails, and a later sign-in retries that same id', async () => {
    const localId = createGuestCharacter({
      name: 'Over limit',
      level: 1,
      abilities: DEFAULT_ABILITIES,
    });
    const requestId = localId.slice('local-'.length);
    createCharacter.mockRejectedValueOnce(new Error('quota'));

    await expect(
      Promise.all([migrateGuestCharactersOnSignIn(), migrateGuestCharactersOnSignIn()]),
    ).resolves.toEqual([0, 0]);
    expect(createCharacter).toHaveBeenCalledTimes(1);
    expect(createCharacter).toHaveBeenCalledWith(expect.anything(), { clientRequestId: requestId });
    expect(getGuestCharacter(localId)?.name).toBe('Over limit');

    createCharacter.mockResolvedValueOnce('server-character');
    await expect(migrateGuestCharactersOnSignIn()).resolves.toBe(1);
    expect(createCharacter).toHaveBeenCalledTimes(2);
    expect(createCharacter.mock.calls[1]?.[1]).toEqual({ clientRequestId: requestId });
    expect(getGuestCharactersList()).toHaveLength(0);
  });
});
