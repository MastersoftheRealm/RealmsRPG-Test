import { describe, expect, it } from 'vitest';
import type { User } from '@supabase/supabase-js';
import { googleIdentityFreshSignInInWindow } from '@/lib/auth/oauth-google-delete-proof';

function dualUser(googleLastSignIn: string): User {
  return {
    id: 'user-1',
    identities: [
      { provider: 'google', last_sign_in_at: googleLastSignIn },
      { provider: 'github', last_sign_in_at: '2020-01-01T00:00:00.000Z' },
    ],
  } as User;
}

describe('googleIdentityFreshSignInInWindow', () => {
  const windowStart = 1_700_000_000;
  const windowEnd = windowStart + 600;

  it('accepts a Google identity timestamp inside the intent window', () => {
    const user = dualUser(new Date(windowStart * 1000 + 5000).toISOString());
    expect(googleIdentityFreshSignInInWindow(user, windowStart, windowEnd)).toBe(true);
  });

  it('rejects when Google identity last_sign_in_at is stale', () => {
    const user = dualUser('2019-06-01T00:00:00.000Z');
    expect(googleIdentityFreshSignInInWindow(user, windowStart, windowEnd)).toBe(false);
  });
});
