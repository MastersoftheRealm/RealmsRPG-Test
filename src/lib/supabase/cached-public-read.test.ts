import { describe, expect, it, vi } from 'vitest';
import { readCachedPublicData, readCachedPublicDataWhenValid } from './cached-public-read';

describe('readCachedPublicData', () => {
  it('dedupes loaders by unstable_cache key parts', async () => {
    const loader = vi.fn(async () => 'ok');
    await readCachedPublicData(['dedupe-key'], ['tag-a'], 3600, loader);
    await readCachedPublicData(['dedupe-key'], ['tag-a'], 3600, loader);
    expect(loader).toHaveBeenCalledTimes(1);
  });
});

describe('readCachedPublicDataWhenValid', () => {
  it('returns rejected values without caching them', async () => {
    const loader = vi.fn(async () => ({ empty: true }));
    const first = await readCachedPublicDataWhenValid(
      ['skip-empty'],
      ['tag-b'],
      3600,
      loader,
      (value) => !value.empty,
    );
    const second = await readCachedPublicDataWhenValid(
      ['skip-empty'],
      ['tag-b'],
      3600,
      loader,
      (value) => !value.empty,
    );
    expect(first).toEqual({ empty: true });
    expect(second).toEqual({ empty: true });
    expect(loader).toHaveBeenCalledTimes(2);
  });
});
