import { describe, expect, it } from 'vitest';
import { shouldClearQueryCacheOnAuthEvent } from './should-clear-query-cache-on-auth-event';

describe('shouldClearQueryCacheOnAuthEvent', () => {
  it('clears on SIGNED_OUT even when both sides are already null', () => {
    expect(
      shouldClearQueryCacheOnAuthEvent({
        event: 'SIGNED_OUT',
        previousUserId: null,
        nextUserId: null,
      }),
    ).toBe(true);
  });

  it('clears on SIGNED_IN when the user id changes (including anon → user)', () => {
    expect(
      shouldClearQueryCacheOnAuthEvent({
        event: 'SIGNED_IN',
        previousUserId: null,
        nextUserId: 'user-a',
      }),
    ).toBe(true);
    expect(
      shouldClearQueryCacheOnAuthEvent({
        event: 'SIGNED_IN',
        previousUserId: 'user-a',
        nextUserId: 'user-b',
      }),
    ).toBe(true);
  });

  it('does not clear on same-user visibility-recovery SIGNED_IN', () => {
    expect(
      shouldClearQueryCacheOnAuthEvent({
        event: 'SIGNED_IN',
        previousUserId: 'user-a',
        nextUserId: 'user-a',
      }),
    ).toBe(false);
  });

  it('does not clear on TOKEN_REFRESHED or INITIAL_SESSION', () => {
    expect(
      shouldClearQueryCacheOnAuthEvent({
        event: 'TOKEN_REFRESHED',
        previousUserId: 'user-a',
        nextUserId: 'user-a',
      }),
    ).toBe(false);
    expect(
      shouldClearQueryCacheOnAuthEvent({
        event: 'INITIAL_SESSION',
        previousUserId: null,
        nextUserId: 'user-a',
      }),
    ).toBe(false);
  });

  it('clears USER_UPDATED only when the user id changes', () => {
    expect(
      shouldClearQueryCacheOnAuthEvent({
        event: 'USER_UPDATED',
        previousUserId: 'user-a',
        nextUserId: 'user-a',
      }),
    ).toBe(false);
    expect(
      shouldClearQueryCacheOnAuthEvent({
        event: 'USER_UPDATED',
        previousUserId: 'user-a',
        nextUserId: 'user-b',
      }),
    ).toBe(true);
  });
});
