import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  OAUTH_DELETE_INTENT_COOKIE,
  verifyOAuthDeleteIntent,
} from '@/lib/auth/oauth-delete-grant-core';
function encodeSupabaseSsrCookieValue(value: string): string {
  return `base64-${Buffer.from(value, 'utf8').toString('base64url')}`;
}

const mockRequireLiveUser = vi.fn();
const mockGetUser = vi.fn();
const mockSignInWithOAuth = vi.fn();
const mockCookieSet = vi.fn();
const mockCookieGetAll = vi.fn();

vi.mock('@/lib/supabase/session', () => ({
  requireLiveUser: (...args: unknown[]) => mockRequireLiveUser(...args),
}));

vi.mock('next/headers', () => ({
  cookies: vi.fn(async () => ({
    set: mockCookieSet,
    getAll: mockCookieGetAll,
  })),
  headers: vi.fn(
    async () =>
      new Headers({
        host: 'evil.example',
        'x-forwarded-host': 'evil.example',
        'x-forwarded-proto': 'https',
      }),
  ),
}));

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(async () => ({
    auth: {
      getUser: mockGetUser,
      signInWithOAuth: mockSignInWithOAuth,
    },
  })),
}));

import { beginGoogleDeleteReauthAction } from './actions';

const PKCE_COOKIE = 'sb-test-auth-token-code-verifier';
const VERIFIER = 'server-started-pkce-verifier';

describe('beginGoogleDeleteReauthAction', () => {
  const originalSite = process.env.NEXT_PUBLIC_SITE_URL;
  const originalSupabase = process.env.NEXT_PUBLIC_SUPABASE_URL;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv('NODE_ENV', 'production');
    process.env.NEXT_PUBLIC_SITE_URL = 'https://realmsrpg.com';
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key';
    mockRequireLiveUser.mockResolvedValue({ uid: 'user-1', email: 'hero@example.com' });
    mockGetUser.mockResolvedValue({
      data: {
        user: {
          id: 'user-1',
          identities: [{ provider: 'google' }],
          app_metadata: { provider: 'google' },
        },
      },
      error: null,
    });
    mockSignInWithOAuth.mockResolvedValue({
      data: { url: 'https://accounts.google.com/o/oauth2/v2/auth?test=1' },
      error: null,
    });
    mockCookieGetAll.mockReturnValue([
      { name: PKCE_COOKIE, value: encodeSupabaseSsrCookieValue(VERIFIER) },
    ]);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    if (originalSite === undefined) delete process.env.NEXT_PUBLIC_SITE_URL;
    else process.env.NEXT_PUBLIC_SITE_URL = originalSite;
    if (originalSupabase === undefined) delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    else process.env.NEXT_PUBLIC_SUPABASE_URL = originalSupabase;
  });

  it('starts Google OAuth on the server and stores a pkce-bound intent cookie', async () => {
    const result = await beginGoogleDeleteReauthAction();

    expect(result).toEqual({
      success: true,
      url: 'https://accounts.google.com/o/oauth2/v2/auth?test=1',
    });
    expect(mockSignInWithOAuth).toHaveBeenCalledWith({
      provider: 'google',
      options: expect.objectContaining({
        skipBrowserRedirect: true,
        redirectTo: 'https://realmsrpg.com/auth/callback?next=%2Fmy-account%3FdeleteReauth%3D1',
      }),
    });
    expect(mockSignInWithOAuth.mock.calls[0]?.[0].options.redirectTo).not.toContain('evil.example');
    expect(mockCookieSet).toHaveBeenCalledWith(
      OAUTH_DELETE_INTENT_COOKIE,
      expect.any(String),
      expect.objectContaining({ httpOnly: true }),
    );
    const intentToken = mockCookieSet.mock.calls[0]?.[1] as string;
    expect(verifyOAuthDeleteIntent(intentToken, 'user-1', VERIFIER)).toBe(true);
  });

  it('rejects password accounts', async () => {
    mockGetUser.mockResolvedValue({
      data: {
        user: {
          id: 'user-1',
          identities: [{ provider: 'email' }],
          app_metadata: { provider: 'email' },
        },
      },
      error: null,
    });

    const result = await beginGoogleDeleteReauthAction();

    expect(result).toEqual({ success: false, error: 'Authentication required' });
    expect(mockSignInWithOAuth).not.toHaveBeenCalled();
  });

  it('fails when signInWithOAuth does not return a verifier cookie', async () => {
    mockCookieGetAll.mockReturnValue([]);
    const result = await beginGoogleDeleteReauthAction();
    expect(result).toEqual({ success: false, error: 'Authentication required' });
  });
});
