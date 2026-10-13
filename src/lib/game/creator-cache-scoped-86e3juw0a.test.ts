import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  CREATOR_NEW_DRAFT_SCOPE,
  creatorSessionCacheKey,
  persistCreatorSessionDraft,
  readCreatorCache,
  readNewCreatorDraftCache,
  scopedCreatorCacheKey,
} from './creator-cache';
import { CREATOR_CACHE_KEYS } from './creator-constants';

const BASE = CREATOR_CACHE_KEYS.POWER;

function installStorages() {
  const local = new Map<string, string>();
  const session = new Map<string, string>();
  const localStorage = {
    getItem: (key: string) => local.get(key) ?? null,
    setItem: (key: string, value: string) => {
      local.set(key, value);
    },
    removeItem: (key: string) => {
      local.delete(key);
    },
  };
  const sessionStorage = {
    getItem: (key: string) => session.get(key) ?? null,
    setItem: (key: string, value: string) => {
      session.set(key, value);
    },
    removeItem: (key: string) => {
      session.delete(key);
    },
  };
  vi.stubGlobal('window', { localStorage, sessionStorage });
  vi.stubGlobal('localStorage', localStorage);
  vi.stubGlobal('sessionStorage', sessionStorage);
  return { local, session };
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('scoped creator draft cache (86e3juw0a)', () => {
  it('scopes confirmed ?edit= autosave per library id', () => {
    installStorages();
    const now = Date.now();
    persistCreatorSessionDraft(BASE, 'power-a', true, { name: 'Tab A', timestamp: now }, false);
    persistCreatorSessionDraft(BASE, 'power-b', true, { name: 'Tab B', timestamp: now }, false);

    const keyA = scopedCreatorCacheKey(BASE, 'power-a');
    const keyB = scopedCreatorCacheKey(BASE, 'power-b');
    expect(readCreatorCache<{ name: string }>(keyA)?.name).toBe('Tab A');
    expect(readCreatorCache<{ name: string }>(keyB)?.name).toBe('Tab B');
  });

  it('keeps new-draft autosave in sessionStorage per tab', () => {
    const { session } = installStorages();
    const now = Date.now();
    const newKey = scopedCreatorCacheKey(BASE, null);
    expect(newKey).toContain(CREATOR_NEW_DRAFT_SCOPE);

    persistCreatorSessionDraft(BASE, null, false, { name: 'Draft 1', timestamp: now }, false);
    expect(session.get(newKey)).toContain('Draft 1');
    expect(readNewCreatorDraftCache<{ name: string }>(BASE)?.name).toBe('Draft 1');
  });

  it('resolves session cache keys for edit vs new draft', () => {
    expect(creatorSessionCacheKey(BASE, 'id-1', true)).toBe(scopedCreatorCacheKey(BASE, 'id-1'));
    expect(creatorSessionCacheKey(BASE, 'id-1', false)).toBe(scopedCreatorCacheKey(BASE, null));
    expect(creatorSessionCacheKey(BASE, null, false)).toBe(scopedCreatorCacheKey(BASE, null));
  });
});
