import { describe, expect, it } from 'vitest';
import type { User } from '@supabase/supabase-js';
import {
  OAUTH_DELETE_FRESH_SIGN_IN_MS,
  OAUTH_DELETE_REAUTH_REQUIRED,
  assertOAuthDeleteFreshSignIn,
  isOAuthDeleteSignInFresh,
} from '@/lib/auth/oauth-delete-reauth';

function googleUser(lastSignInAt: string | undefined): User {
  return {
    id: 'user-1',
    last_sign_in_at: lastSignInAt,
    app_metadata: { provider: 'google' },
    identities: [{ provider: 'google' }],
  } as User;
}

describe('isOAuthDeleteSignInFresh', () => {
  const now = Date.parse('2026-11-07T12:00:00.000Z');

  it('accepts a sign-in within the window', () => {
    const freshAt = new Date(now - 60_000).toISOString();
    expect(isOAuthDeleteSignInFresh(googleUser(freshAt), now)).toBe(true);
  });

  it('rejects a sign-in older than the window', () => {
    const staleAt = new Date(now - OAUTH_DELETE_FRESH_SIGN_IN_MS - 1).toISOString();
    expect(isOAuthDeleteSignInFresh(googleUser(staleAt), now)).toBe(false);
  });

  it('rejects a missing last_sign_in_at', () => {
    expect(isOAuthDeleteSignInFresh(googleUser(undefined), now)).toBe(false);
  });
});

describe('assertOAuthDeleteFreshSignIn', () => {
  it('returns the sentinel error when sign-in is stale', () => {
    const now = Date.now();
    const staleAt = new Date(now - OAUTH_DELETE_FRESH_SIGN_IN_MS - 1).toISOString();
    expect(assertOAuthDeleteFreshSignIn(googleUser(staleAt), now)).toEqual({
      ok: false,
      error: OAUTH_DELETE_REAUTH_REQUIRED,
    });
  });
});
