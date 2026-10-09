import { afterEach, describe, expect, it, vi } from 'vitest';
import { createCreatorDraftDiscard, persistCreatorDraft, readCreatorCache } from './creator-cache';

const KEY = 'realms-power-creator-cache';

function installStorage() {
  const store = new Map<string, string>();
  const storage = {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => {
      store.set(key, value);
    },
    removeItem: (key: string) => {
      store.delete(key);
    },
  };
  vi.stubGlobal('window', {});
  vi.stubGlobal('localStorage', storage);
  return storage;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('creator draft discard', () => {
  it('drops the stored draft and does not let the leaving page write it back', () => {
    const storage = installStorage();
    type Draft = { name: string; timestamp: number };
    persistCreatorDraft(KEY, { name: 'Kept', timestamp: Date.now() }, false);
    expect(readCreatorCache<Draft>(KEY)?.name).toBe('Kept');

    const discard = createCreatorDraftDiscard();
    discard.discard(KEY);
    expect(storage.getItem(KEY)).toBeNull();

    persistCreatorDraft(KEY, { name: 'Ghost', timestamp: Date.now() }, discard.isDiscarded());
    expect(storage.getItem(KEY)).toBeNull();

    persistCreatorDraft(KEY, { name: 'Next', timestamp: Date.now() }, false);
    expect(readCreatorCache<Draft>(KEY)?.name).toBe('Next');
  });
});
