import { beforeEach, vi } from 'vitest';

vi.mock('server-only', () => ({}));

type UnstableCacheEntry = { promise: Promise<unknown>; tags: string[] };
const unstableCacheStore = new Map<string, UnstableCacheEntry>();

function purgeUnstableCacheByTag(tag: string): void {
  for (const [key, entry] of unstableCacheStore) {
    if (entry.tags.includes(tag)) unstableCacheStore.delete(key);
  }
}

vi.mock('next/cache', () => ({
  unstable_cache: (
    loader: () => Promise<unknown>,
    keyParts?: string[],
    options?: { tags?: string[] },
  ) => {
    const key = keyParts?.join('|') ?? 'default';
    const tags = options?.tags ?? [];
    return () => {
      const existing = unstableCacheStore.get(key);
      if (existing) return existing.promise;
      const promise = loader().then((value) => {
        unstableCacheStore.set(key, { promise: Promise.resolve(value), tags });
        return value;
      });
      return promise;
    };
  },
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn((tag: string, profile?: string | { expire?: number }) => {
    if (profile === 'max') return;
    if (profile === undefined || (typeof profile === 'object' && profile.expire === 0)) {
      purgeUnstableCacheByTag(tag);
    }
  }),
  updateTag: vi.fn((tag: string) => {
    purgeUnstableCacheByTag(tag);
  }),
}));

beforeEach(() => {
  unstableCacheStore.clear();
});
