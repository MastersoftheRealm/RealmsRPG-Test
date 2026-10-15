import { beforeEach, vi } from 'vitest';

const unstableCacheStore = new Map<string, Promise<unknown>>();

vi.mock('next/cache', () => ({
  unstable_cache: (loader: () => Promise<unknown>, keyParts?: string[]) => {
    const key = keyParts?.join('|') ?? 'default';
    return () => {
      const existing = unstableCacheStore.get(key);
      if (existing) return existing;
      const pending = loader();
      unstableCacheStore.set(key, pending);
      return pending;
    };
  },
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
  updateTag: vi.fn(),
}));

beforeEach(() => {
  unstableCacheStore.clear();
});
