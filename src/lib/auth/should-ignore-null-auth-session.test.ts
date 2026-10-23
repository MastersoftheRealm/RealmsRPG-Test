import { describe, expect, it } from 'vitest';
import { shouldIgnoreNullAuthSession } from './should-ignore-null-auth-session';

describe('shouldIgnoreNullAuthSession', () => {
  it('keeps a known user when a listener emits a null session that is not sign-out', () => {
    expect(
      shouldIgnoreNullAuthSession({
        event: 'INITIAL_SESSION',
        previousUserId: 'user-a',
        nextUserId: null,
      }),
    ).toBe(true);
    expect(
      shouldIgnoreNullAuthSession({
        event: 'TOKEN_REFRESHED',
        previousUserId: 'user-a',
        nextUserId: '',
      }),
    ).toBe(true);
  });

  it('still clears the user on SIGNED_OUT', () => {
    expect(
      shouldIgnoreNullAuthSession({
        event: 'SIGNED_OUT',
        previousUserId: 'user-a',
        nextUserId: null,
      }),
    ).toBe(false);
  });

  it('accepts the first null session for a signed-out visitor', () => {
    expect(
      shouldIgnoreNullAuthSession({
        event: 'INITIAL_SESSION',
        previousUserId: null,
        nextUserId: null,
      }),
    ).toBe(false);
  });

  it('accepts a real signed-in session', () => {
    expect(
      shouldIgnoreNullAuthSession({
        event: 'INITIAL_SESSION',
        previousUserId: null,
        nextUserId: 'user-a',
      }),
    ).toBe(false);
  });
});
