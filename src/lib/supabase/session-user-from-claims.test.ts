import type { JwtPayload } from '@supabase/supabase-js';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('./server', () => ({
  createClient: vi.fn(),
}));

vi.mock('./verified-claims', () => ({
  getVerifiedClaims: vi.fn(),
}));

import type { User } from '@supabase/supabase-js';
import { createClient } from './server';
import { getSession, requireLiveUser, sessionUserFromClaims } from './session';
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

describe('requireLiveUser', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  function authClient(result: { user: User | null; error: { message: string } | null }) {
    return {
      auth: {
        getUser: vi.fn(async () => ({ data: { user: result.user }, error: result.error })),
      },
    };
  }

  it('maps the Auth user and does not verify claims locally', async () => {
    const getUser = vi.fn(async () => ({
      data: {
        user: {
          id: 'user-1',
          email: 'player@example.com',
          email_confirmed_at: '2026-01-01T00:00:00Z',
          user_metadata: { full_name: 'Player One', avatar_url: 'https://example.com/a.png' },
        } as unknown as User,
      },
      error: null,
    }));
    mockCreateClient.mockResolvedValue({ auth: { getUser } } as unknown as Awaited<
      ReturnType<typeof createClient>
    >);

    await expect(requireLiveUser()).resolves.toEqual({
      uid: 'user-1',
      email: 'player@example.com',
      name: 'Player One',
      picture: 'https://example.com/a.png',
      emailVerified: true,
    });
    expect(getUser).toHaveBeenCalledTimes(1);
    expect(mockGetVerifiedClaims).not.toHaveBeenCalled();
  });

  it('throws when Auth reports no user, including a revoked or banned session', async () => {
    mockCreateClient.mockResolvedValue(
      authClient({ user: null, error: { message: 'User banned' } }) as unknown as Awaited<
        ReturnType<typeof createClient>
      >,
    );

    await expect(requireLiveUser()).rejects.toThrow('Authentication required');
    expect(mockGetVerifiedClaims).not.toHaveBeenCalled();
  });

  it('throws when Auth returns a user with no id', async () => {
    mockCreateClient.mockResolvedValue(
      authClient({ user: { id: '' } as unknown as User, error: null }) as unknown as Awaited<
        ReturnType<typeof createClient>
      >,
    );

    await expect(requireLiveUser()).rejects.toThrow('Authentication required');
  });
});
