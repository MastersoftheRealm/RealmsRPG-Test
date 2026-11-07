import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { User } from '@supabase/supabase-js';
import { OAUTH_DELETE_GRANT_COOKIE } from '@/lib/auth/oauth-delete-grant';

const { exchangeCodeForSession, cookieSet, createServerClient, createUserProfileAction } =
  vi.hoisted(() => ({
    exchangeCodeForSession: vi.fn(),
    cookieSet: vi.fn(),
    createServerClient: vi.fn(),
    createUserProfileAction: vi.fn(),
  }));

vi.mock('next/headers', () => ({
  cookies: vi.fn(async () => ({
    getAll: () => [],
    set: cookieSet,
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

function accessToken(sessionId: string): string {
  const header = Buffer.from(JSON.stringify({ alg: 'none', typ: 'JWT' })).toString('base64url');
  const payload = Buffer.from(JSON.stringify({ sub: 'user-1', session_id: sessionId })).toString(
    'base64url',
  );
  return `${header}.${payload}.sig`;
}

describe('GET /auth/callback', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key';
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY = 'test-publishable-key';
    createUserProfileAction.mockResolvedValue({ success: true });
  });

  it('mints an OAuth delete grant after Google PKCE when deleteReauth=1 is in next', async () => {
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

    createServerClient.mockImplementation(
      (
        _url: string,
        _key: string,
        options: { cookies: { setAll: (items: unknown[]) => void } },
      ) => ({
        auth: { exchangeCodeForSession },
        cookies: options.cookies,
      }),
    );

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

  it('does not mint an OAuth delete grant for an ordinary OAuth sign-in', async () => {
    exchangeCodeForSession.mockResolvedValue({
      data: {
        user: googleUser(),
        session: { access_token: accessToken('sess-login') },
      },
      error: null,
    });

    createServerClient.mockImplementation(
      (
        _url: string,
        _key: string,
        options: { cookies: { setAll: (items: unknown[]) => void } },
      ) => ({
        auth: { exchangeCodeForSession },
        cookies: options.cookies,
      }),
    );

    const response = await GET(
      new Request('http://localhost/auth/callback?code=pkce-code&next=%2Fcharacters'),
    );

    expect(response.cookies.get(OAUTH_DELETE_GRANT_COOKIE)).toBeUndefined();
  });
});
