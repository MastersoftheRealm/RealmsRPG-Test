import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { User } from '@supabase/supabase-js';
import {
  OAUTH_DELETE_GRANT_COOKIE,
  OAUTH_DELETE_INTENT_COOKIE,
  mintOAuthDeleteIntent,
} from '@/lib/auth/oauth-delete-grant-core';

const {
  exchangeCodeForSession,
  cookieSet,
  cookieGet,
  createServerClient,
  createUserProfileAction,
} = vi.hoisted(() => ({
  exchangeCodeForSession: vi.fn(),
  cookieSet: vi.fn(),
  cookieGet: vi.fn(),
  createServerClient: vi.fn(),
  createUserProfileAction: vi.fn(),
}));

vi.mock('next/headers', () => ({
  cookies: vi.fn(async () => ({
    getAll: () => [],
    set: cookieSet,
    get: cookieGet,
  })),
}));

vi.mock('@supabase/ssr', () => ({
  createServerClient,
}));

vi.mock('@/app/(auth)/actions', () => ({
  createUserProfileAction,
}));

import { GET } from './route';

function googleUser(): User {
  return {
    id: 'user-1',
    email: 'hero@example.com',
    app_metadata: { provider: 'google' },
    identities: [{ provider: 'google' }],
  } as User;
}

function githubUser(): User {
  return {
    id: 'user-1',
    email: 'hero@example.com',
    app_metadata: { provider: 'github' },
    identities: [{ provider: 'github' }],
  } as User;
}

function accessToken(sessionId: string): string {
  const header = Buffer.from(JSON.stringify({ alg: 'none', typ: 'JWT' })).toString('base64url');
  const payload = Buffer.from(JSON.stringify({ sub: 'user-1', session_id: sessionId })).toString(
    'base64url',
  );
  return `${header}.${payload}.sig`;
}

function stubSupabaseClient() {
  createServerClient.mockImplementation(
    (_url: string, _key: string, options: { cookies: { setAll: (items: unknown[]) => void } }) => ({
      auth: { exchangeCodeForSession },
      cookies: options.cookies,
    }),
  );
}

describe('GET /auth/callback', () => {
  const now = 1_700_000_000;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.setSystemTime(now * 1000);
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key';
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY = 'test-publishable-key';
    createUserProfileAction.mockResolvedValue({ success: true });
    cookieGet.mockReturnValue(undefined);
    stubSupabaseClient();
  });

  it('mints an OAuth delete grant after Google PKCE when intent and deleteReauth=1 are present', async () => {
    const intent = mintOAuthDeleteIntent('user-1', 'nonce-1', now)!;
    cookieGet.mockImplementation((name: string) =>
      name === OAUTH_DELETE_INTENT_COOKIE ? { name, value: intent } : undefined,
    );

    exchangeCodeForSession.mockImplementation(async (code: string) => {
      expect(code).toBe('pkce-code');
      return {
        data: {
          user: googleUser(),
          session: { access_token: accessToken('sess-delete') },
        },
        error: null,
      };
    });

    const response = await GET(
      new Request(
        'http://localhost/auth/callback?code=pkce-code&next=%2Fmy-account%3FdeleteReauth%3D1',
      ),
    );

    expect(response.status).toBe(307);
    const grant = response.cookies.get(OAUTH_DELETE_GRANT_COOKIE);
    expect(grant?.value).toBeTruthy();
    expect(grant?.httpOnly).toBe(true);
  });

  it('does not mint a grant when the reauth intent cookie is missing', async () => {
    exchangeCodeForSession.mockResolvedValue({
      data: {
        user: googleUser(),
        session: { access_token: accessToken('sess-delete') },
      },
      error: null,
    });

    const response = await GET(
      new Request(
        'http://localhost/auth/callback?code=pkce-code&next=%2Fmy-account%3FdeleteReauth%3D1',
      ),
    );

    expect(response.cookies.get(OAUTH_DELETE_GRANT_COOKIE)).toBeUndefined();
  });

  it('does not mint a grant when the intent uid does not match the signed-in user', async () => {
    const intent = mintOAuthDeleteIntent('other-user', 'nonce-1', now)!;
    cookieGet.mockImplementation((name: string) =>
      name === OAUTH_DELETE_INTENT_COOKIE ? { name, value: intent } : undefined,
    );
    exchangeCodeForSession.mockResolvedValue({
      data: {
        user: googleUser(),
        session: { access_token: accessToken('sess-delete') },
      },
      error: null,
    });

    const response = await GET(
      new Request(
        'http://localhost/auth/callback?code=pkce-code&next=%2Fmy-account%3FdeleteReauth%3D1',
      ),
    );

    expect(response.cookies.get(OAUTH_DELETE_GRANT_COOKIE)).toBeUndefined();
  });

  it('does not mint a grant when the exchange is not Google', async () => {
    const intent = mintOAuthDeleteIntent('user-1', 'nonce-1', now)!;
    cookieGet.mockImplementation((name: string) =>
      name === OAUTH_DELETE_INTENT_COOKIE ? { name, value: intent } : undefined,
    );
    exchangeCodeForSession.mockResolvedValue({
      data: {
        user: githubUser(),
        session: { access_token: accessToken('sess-delete') },
      },
      error: null,
    });

    const response = await GET(
      new Request(
        'http://localhost/auth/callback?code=pkce-code&next=%2Fmy-account%3FdeleteReauth%3D1',
      ),
    );

    expect(response.cookies.get(OAUTH_DELETE_GRANT_COOKIE)).toBeUndefined();
  });

  it('does not mint a grant when code exchange fails', async () => {
    const intent = mintOAuthDeleteIntent('user-1', 'nonce-1', now)!;
    cookieGet.mockImplementation((name: string) =>
      name === OAUTH_DELETE_INTENT_COOKIE ? { name, value: intent } : undefined,
    );
    exchangeCodeForSession.mockResolvedValue({
      data: { user: null, session: null },
      error: { message: 'fail' },
    });

    const response = await GET(
      new Request(
        'http://localhost/auth/callback?code=pkce-code&next=%2Fmy-account%3FdeleteReauth%3D1',
      ),
    );

    expect(response.status).toBe(307);
    expect(response.cookies.get(OAUTH_DELETE_GRANT_COOKIE)).toBeUndefined();
  });

  it('does not mint an OAuth delete grant for an ordinary OAuth sign-in', async () => {
    const intent = mintOAuthDeleteIntent('user-1', 'nonce-1', now)!;
    cookieGet.mockImplementation((name: string) =>
      name === OAUTH_DELETE_INTENT_COOKIE ? { name, value: intent } : undefined,
    );
    exchangeCodeForSession.mockResolvedValue({
      data: {
        user: googleUser(),
        session: { access_token: accessToken('sess-login') },
      },
      error: null,
    });

    const response = await GET(
      new Request('http://localhost/auth/callback?code=pkce-code&next=%2Fcharacters'),
    );

    expect(response.cookies.get(OAUTH_DELETE_GRANT_COOKIE)).toBeUndefined();
  });
});
