import { describe, expect, it, vi, beforeEach } from 'vitest';

const { updateTag } = vi.hoisted(() => ({
  updateTag: vi.fn(() => {
    throw new Error('purge failed');
  }),
}));

vi.mock('next/cache', () => ({ updateTag, revalidateTag: vi.fn() }));

vi.mock('@/lib/api-error', () => ({
  logApiError: vi.fn(),
}));

import { logApiError } from '@/lib/api-error';
import { purgeCodexCollectionPublicCachesBestEffort } from './public-catalog-cache-purge';

describe('public-catalog-cache-purge', () => {
  beforeEach(() => {
    vi.mocked(logApiError).mockClear();
    updateTag.mockClear();
  });

  it('logs a failed purge instead of throwing after a committed write', () => {
    expect(() =>
      purgeCodexCollectionPublicCachesBestEffort('core_rules', 'core_rules', 'test purge'),
    ).not.toThrow();
    expect(logApiError).toHaveBeenCalled();
  });
});
