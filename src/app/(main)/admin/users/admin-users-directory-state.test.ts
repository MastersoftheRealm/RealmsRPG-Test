import { describe, expect, it } from 'vitest';
import { nextContinuationBusyMap, tryApplyContinuationResult } from './admin-users-directory-state';

describe('nextContinuationBusyMap', () => {
  it('clears an older owner busy flag without affecting a newer pending continuation', () => {
    const oldKey = '0\u0000';
    const newKey = '1\u0000alice';
    const busy = nextContinuationBusyMap(nextContinuationBusyMap({}, oldKey, true), newKey, true);
    expect(busy).toEqual({ [oldKey]: true, [newKey]: true });
    const afterOldFinally = nextContinuationBusyMap(busy, oldKey, false);
    expect(afterOldFinally).toEqual({ [newKey]: true });
  });
});

describe('tryApplyContinuationResult', () => {
  const base = {
    owner: { generation: 1, q: 'alice' },
    users: [{ id: 'a' }],
    hasMore: true,
    continuationError: null as string | null,
  };

  it('ignores continuation when generation changes but user count stays equal', () => {
    const request = { generation: 0, q: 'alice', offset: 1 };
    const next = tryApplyContinuationResult(base, request, {
      ok: true,
      users: [{ id: 'stale' }],
      hasMore: false,
    });
    expect(next).toBe(base);
  });

  it('ignores continuation when query changes with same length', () => {
    const request = { generation: 1, q: 'bob', offset: 1 };
    const next = tryApplyContinuationResult(base, request, {
      ok: true,
      users: [{ id: 'stale' }],
      hasMore: false,
    });
    expect(next).toBe(base);
  });
});
