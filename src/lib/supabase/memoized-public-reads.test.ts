import { beforeEach, describe, expect, it, vi } from 'vitest';
import { memoizedPublicRead, resetMemoizedPublicReadsForTests } from './memoized-public-reads';

describe('memoizedPublicRead', () => {
  beforeEach(() => {
    resetMemoizedPublicReadsForTests();
  });

  it('runs the loader once per cache key', async () => {
    const loader = vi.fn(async () => 42);
    await memoizedPublicRead('test-key', loader);
    await memoizedPublicRead('test-key', loader);
    expect(loader).toHaveBeenCalledTimes(1);
  });
});
