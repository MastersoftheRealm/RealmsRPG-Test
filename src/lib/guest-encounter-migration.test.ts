import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Encounter } from '@/types/encounter';
import {
  createGuestEncounter,
  getGuestEncounter,
  getGuestEncountersList,
} from './guest-encounter-storage';

const createEncounter = vi.hoisted(() => vi.fn());

vi.mock('@/services/encounter-service', () => ({
  createEncounter: (...args: unknown[]) => createEncounter(...args),
}));

vi.mock('@/lib/api-client', () => ({
  logClientError: vi.fn(),
}));

import { migrateGuestEncountersOnSignIn } from './guest-encounter-migration';

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

function guestEncounter(name: string): Omit<Encounter, 'id' | 'createdAt' | 'updatedAt'> {
  const combatant = (id: string, combatantName: string) => ({
    id,
    name: combatantName,
    initiative: 1,
    acuity: 0,
    maxHealth: 10,
    currentHealth: 10,
    maxEnergy: 0,
    currentEnergy: 0,
    armor: 0,
    evasion: 0,
    ap: 0,
    conditions: [],
    notes: '',
    combatantType: 'enemy' as const,
    isAlly: false,
    isSurprised: false,
  });
  return {
    name,
    type: 'combat',
    status: 'preparing',
    combatants: [combatant('c1', 'One'), combatant('c2', 'Two')],
    round: 0,
    currentTurnIndex: 0,
    isActive: false,
    applySurprise: false,
  };
}

describe('guest encounter sign-in migration (86e3jmw1m)', () => {
  beforeEach(() => {
    installMemoryStorage();
    createEncounter.mockReset();
  });

  it('imports one guest encounter once when sign-in starts many migrations together', async () => {
    const localId = createGuestEncounter(guestEncounter('S6 Guest Encounter'));
    let resolveCreate: (id: string) => void = () => {};
    createEncounter.mockImplementation(
      () =>
        new Promise<string>((resolve) => {
          resolveCreate = resolve;
        }),
    );

    const pending = Promise.all(Array.from({ length: 10 }, () => migrateGuestEncountersOnSignIn()));

    expect(createEncounter).toHaveBeenCalledTimes(1);
    expect(createEncounter).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'S6 Guest Encounter',
        combatants: expect.arrayContaining([
          expect.objectContaining({ name: 'One' }),
          expect.objectContaining({ name: 'Two' }),
        ]),
      }),
    );

    resolveCreate('server-encounter');
    const counts = await pending;

    expect(createEncounter).toHaveBeenCalledTimes(1);
    expect(counts).toEqual(Array.from({ length: 10 }, () => 1));
    expect(getGuestEncountersList()).toHaveLength(0);
    expect(getGuestEncounter(localId)).toBeNull();

    createEncounter.mockClear();
    await expect(migrateGuestEncountersOnSignIn()).resolves.toBe(0);
    expect(createEncounter).not.toHaveBeenCalled();
  });
});
