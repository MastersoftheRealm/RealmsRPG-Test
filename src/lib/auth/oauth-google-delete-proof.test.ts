import { describe, expect, it } from 'vitest';
import type { User } from '@supabase/supabase-js';
import { googleIdentityFreshSignInInWindow } from '@/lib/auth/oauth-google-delete-proof';

function googleIdentityUser(google: { last_sign_in_at?: string; updated_at?: string }): User {
  return {
    id: 'user-1',
    identities: [
      { provider: 'google', ...google },
      { provider: 'github', last_sign_in_at: '2020-01-01T00:00:00.000Z' },
    ],
  } as User;
}

describe('googleIdentityFreshSignInInWindow', () => {
  const windowStart = 1_700_000_000;
  const windowEnd = windowStart + 600;

  it('accepts fresh Google identity updated_at inside the intent window', () => {
    const user = googleIdentityUser({
      last_sign_in_at: '2015-01-01T00:00:00.000Z',
      updated_at: new Date(windowStart * 1000).toISOString(),
    });
    expect(googleIdentityFreshSignInInWindow(user, windowStart, windowEnd)).toBe(true);
  });

  it('ignores stale last_sign_in_at when updated_at is fresh', () => {
    const user = googleIdentityUser({
      last_sign_in_at: '2019-06-01T00:00:00.000Z',
      updated_at: new Date(windowStart * 1000 + 3000).toISOString(),
    });
    expect(googleIdentityFreshSignInInWindow(user, windowStart, windowEnd)).toBe(true);
  });

  it('rejects when Google identity updated_at is stale', () => {
    const user = googleIdentityUser({
      last_sign_in_at: '2019-06-01T00:00:00.000Z',
      updated_at: '2019-06-01T00:00:00.000Z',
    });
    expect(googleIdentityFreshSignInInWindow(user, windowStart, windowEnd)).toBe(false);
  });
});
