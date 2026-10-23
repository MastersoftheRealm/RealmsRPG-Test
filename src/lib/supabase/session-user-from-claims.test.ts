import type { JwtPayload } from '@supabase/supabase-js';
import { describe, expect, it, vi } from 'vitest';

vi.mock('./server', () => ({
  createClient: vi.fn(),
}));

vi.mock('./verified-claims', () => ({
  getVerifiedClaims: vi.fn(),
}));

import { createClient } from './server';
import { getSession, sessionUserFromClaims } from './session';
import { getVerifiedClaims } from './verified-claims';

const mockCreateClient = vi.mocked(createClient);
const mockGetVerifiedClaims = vi.mocked(getVerifiedClaims);

describe('sessionUserFromClaims', () => {
  it('uses the sub claim as the user id and display fields from the token', () => {
    expect(
      sessionUserFromClaims({
        sub: 'user-1',
        email: 'player@example.com',
        email_confirmed_at: '2026-01-01T00:00:00Z',
        user_metadata: {
          full_name: 'Player One',
          avatar_url: 'https://example.com/a.png',
        },
      } as unknown as JwtPayload),
    ).toEqual({
      uid: 'user-1',
      email: 'player@example.com',
      name: 'Player One',
      picture: 'https://example.com/a.png',
      emailVerified: true,
    });
  });

  it('returns null when the token has no subject', () => {
    expect(sessionUserFromClaims(null)).toBeNull();
    expect(sessionUserFromClaims({ email: 'player@example.com' } as JwtPayload)).toBeNull();
  });
});

describe('getSession', () => {
  it('maps verified claims and does not require a user object from the Auth server', async () => {
    mockCreateClient.mockResolvedValue({} as Awaited<ReturnType<typeof createClient>>);
    mockGetVerifiedClaims.mockResolvedValue({
      claims: { sub: 'user-1', email: 'player@example.com' } as JwtPayload,
      error: null,
    });

    await expect(getSession()).resolves.toEqual({
      user: {
        uid: 'user-1',
        email: 'player@example.com',
        name: undefined,
        picture: undefined,
        emailVerified: undefined,
      },
      error: null,
    });
    expect(mockGetVerifiedClaims).toHaveBeenCalledTimes(1);
  });

  it('returns the verifier error and no user', async () => {
    mockCreateClient.mockResolvedValue({} as Awaited<ReturnType<typeof createClient>>);
    mockGetVerifiedClaims.mockResolvedValue({
      claims: null,
      error: { message: 'Invalid session', code: 'refresh_token_not_found' },
    });

    await expect(getSession()).resolves.toEqual({
      user: null,
      error: 'Invalid session',
    });
  });
});
