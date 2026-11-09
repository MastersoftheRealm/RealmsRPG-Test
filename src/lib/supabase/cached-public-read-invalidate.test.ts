import { describe, expect, it } from 'vitest';
import { updateTag } from 'next/cache';
import { readCachedPublicDataWhenValid, CODEX_PUBLIC_ISR_SECONDS } from './cached-public-read';

describe('cached public read after updateTag', () => {
  it('returns fresh loader output after updateTag (no stale public body)', async () => {
    let version = 1;
    const cacheTag = 'catalog-stale-test';

    const first = await readCachedPublicDataWhenValid(
      ['catalog-stale-test'],
      [cacheTag],
      CODEX_PUBLIC_ISR_SECONDS,
      async () => ({ version }),
      () => true,
    );
    expect(first).toEqual({ version: 1 });

    version = 2;
    updateTag(cacheTag);

    const second = await readCachedPublicDataWhenValid(
      ['catalog-stale-test'],
      [cacheTag],
      CODEX_PUBLIC_ISR_SECONDS,
      async () => ({ version }),
      () => true,
    );
    expect(second).toEqual({ version: 2 });
  });
});
