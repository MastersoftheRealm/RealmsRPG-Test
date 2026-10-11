import { beforeEach, describe, expect, it } from 'vitest';
import {
  mixedEncounterViewStorageKey,
  parseMixedEncounterViewTab,
  readMixedEncounterViewTab,
  writeMixedEncounterViewTab,
} from './mixed-encounter-view-tab';

function installSessionStorage() {
  const store = new Map<string, string>();
  const sessionStorage: Storage = {
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
  Object.defineProperty(globalThis, 'sessionStorage', {
    value: sessionStorage,
    configurable: true,
    writable: true,
  });
  Object.defineProperty(globalThis, 'window', {
    value: globalThis,
    configurable: true,
    writable: true,
  });
  return store;
}

describe('mixed encounter view tab persistence (86e3jrra8)', () => {
  let store: Map<string, string>;

  beforeEach(() => {
    store = installSessionStorage();
  });

  it('defaults to combat when nothing is stored', () => {
    expect(parseMixedEncounterViewTab(null)).toBe('combat');
    expect(parseMixedEncounterViewTab('')).toBe('combat');
    expect(parseMixedEncounterViewTab('nope')).toBe('combat');
    expect(readMixedEncounterViewTab('enc-abc')).toBe('combat');
  });

  it('round-trips skill per encounter id in sessionStorage', () => {
    const key = mixedEncounterViewStorageKey('enc-mixed-1');
    writeMixedEncounterViewTab('enc-mixed-1', 'skill');
    expect(store.get(key)).toBe('skill');
    expect(readMixedEncounterViewTab('enc-mixed-1')).toBe('skill');
    expect(readMixedEncounterViewTab('enc-other')).toBe('combat');
  });
});
