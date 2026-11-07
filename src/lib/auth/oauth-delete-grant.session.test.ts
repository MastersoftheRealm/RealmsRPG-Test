import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  OAUTH_DELETE_GRANT_COOKIE,
  OAUTH_DELETE_REAUTH_REQUIRED,
  assertOAuthDeleteSessionGrant,
  mintOAuthDeleteGrant,
} from '@/lib/auth/oauth-delete-grant';

const mockCookieGet = vi.fn();
const mockAuthGetSession = vi.fn();

vi.mock('next/headers', () => ({
  cookies: vi.fn(async () => ({ get: mockCookieGet, delete: vi.fn() })),
}));

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(async () => ({
    auth: {
      getSession: mockAuthGetSession,
    },
  })),
}));

function accessToken(sessionId: string): string {
  const header = Buffer.from(JSON.stringify({ alg: 'none', typ: 'JWT' })).toString('base64url');
  const payload = Buffer.from(JSON.stringify({ sub: 'user-1', session_id: sessionId })).toString(
    'base64url',
  );
  return `${header}.${payload}.sig`;
}

beforeEach(() => {
  vi.clearAllMocks();
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key';
});

describe('assertOAuthDeleteSessionGrant', () => {
  it('rejects when the grant targets a different session than the caller', async () => {
    const now = Math.floor(Date.now() / 1000);
    mockCookieGet.mockReturnValue({
      name: OAUTH_DELETE_GRANT_COOKIE,
      value: mintOAuthDeleteGrant('user-1', 'sess-b', now),
    });
    mockAuthGetSession.mockResolvedValue({
      data: { session: { access_token: accessToken('sess-a') } },
      error: null,
    });

    await expect(assertOAuthDeleteSessionGrant('user-1')).resolves.toEqual({
      ok: false,
      error: OAUTH_DELETE_REAUTH_REQUIRED,
    });
  });

  it('rejects when there is no delete grant after an ordinary session refresh', async () => {
    mockCookieGet.mockReturnValue(undefined);
    mockAuthGetSession.mockResolvedValue({
      data: { session: { access_token: accessToken('sess-a') } },
      error: null,
    });

    await expect(assertOAuthDeleteSessionGrant('user-1')).resolves.toEqual({
      ok: false,
      error: OAUTH_DELETE_REAUTH_REQUIRED,
    });
  });

  it('accepts a grant bound to the current session', async () => {
    const now = Math.floor(Date.now() / 1000);
    mockCookieGet.mockReturnValue({
      name: OAUTH_DELETE_GRANT_COOKIE,
      value: mintOAuthDeleteGrant('user-1', 'sess-a', now),
    });
    mockAuthGetSession.mockResolvedValue({
      data: { session: { access_token: accessToken('sess-a') } },
      error: null,
    });

    await expect(assertOAuthDeleteSessionGrant('user-1')).resolves.toEqual({ ok: true });
  });
});
