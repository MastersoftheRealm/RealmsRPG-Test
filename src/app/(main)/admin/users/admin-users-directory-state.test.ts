import { describe, expect, it } from 'vitest';
import {
  adminUsersDirectoryReducer,
  tryApplyContinuationResult,
} from './admin-users-directory-state';

describe('adminUsersDirectoryReducer', () => {
  const base = {
    owner: { generation: 1, q: 'alice' },
    users: [{ id: 'a' }],
    hasMore: true,
    continuationError: 'older failure' as string | null,
    continuationBusy: true,
  };

  it('query_switch resets owner, rows, errors, and busy synchronously', () => {
    const next = adminUsersDirectoryReducer(base, {
      type: 'query_switch',
      owner: { generation: 2, q: 'bob' },
    });
    expect(next).toEqual({
      owner: { generation: 2, q: 'bob' },
      users: [],
      hasMore: false,
      continuationError: null,
      continuationBusy: false,
    });
  });

  it('initial_page applies only when owner matches', () => {
    const mismatch = adminUsersDirectoryReducer(base, {
      type: 'initial_page',
      owner: { generation: 9, q: 'alice' },
      users: [{ id: 'fresh' }],
      hasMore: false,
    });
    expect(mismatch).toBe(base);

    const match = adminUsersDirectoryReducer(base, {
      type: 'initial_page',
      owner: base.owner,
      users: [{ id: 'fresh' }],
      hasMore: false,
    });
    expect(match.users).toEqual([{ id: 'fresh' }]);
    expect(match.continuationError).toBeNull();
    expect(match.continuationBusy).toBe(false);
  });
});

describe('tryApplyContinuationResult', () => {
  const base = {
    owner: { generation: 1, q: 'alice' },
    users: [{ id: 'a' }],
    hasMore: true,
    continuationError: null as string | null,
    continuationBusy: false,
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

  it('ignores stale continuation failures', () => {
    const request = { generation: 0, q: 'alice', offset: 1 };
    const next = tryApplyContinuationResult(base, request, {
      ok: false,
      error: 'stale failure',
    });
    expect(next).toBe(base);
    expect(next.continuationError).toBeNull();
  });
});
