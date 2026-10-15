import { describe, expect, it, vi } from 'vitest';
import { readCachedPublicData } from './cached-public-read';

describe('readCachedPublicData', () => {
  it('dedupes loaders by unstable_cache key parts', async () => {
    const loader = vi.fn(async () => 'ok');
    await readCachedPublicData(['dedupe-key'], ['tag-a'], 3600, loader);
    await readCachedPublicData(['dedupe-key'], ['tag-a'], 3600, loader);
    expect(loader).toHaveBeenCalledTimes(1);
  });
});
