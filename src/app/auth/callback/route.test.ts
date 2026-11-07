import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { User } from '@supabase/supabase-js';
import {
  OAUTH_DELETE_GRANT_COOKIE,
  OAUTH_DELETE_INTENT_COOKIE,
  hashPkceCodeVerifier,
  mintOAuthDeleteIntent,
} from '@/lib/auth/oauth-delete-grant-core';

const GOOGLE_VERIFIER = 'pkce-verifier-for-google-delete';
const OTHER_VERIFIER = 'pkce-verifier-from-other-provider';
const PKCE_COOKIE_NAME = 'sb-test-auth-token-code-verifier';

const {
  exchangeCodeForSession,
  cookieSet,
  cookieGet,
  cookieGetAll,
  createServerClient,
  createUserProfileAction,
} = vi.hoisted(() => ({
  exchangeCodeForSession: vi.fn(),
  cookieSet: vi.fn(),
  cookieGet: vi.fn(),
  cookieGetAll: vi.fn(),
  createServerClient: vi.fn(),
  createUserProfileAction: vi.fn(),
}));

vi.mock('next/headers', () => ({
  cookies: vi.fn(async () => ({
    getAll: cookieGetAll,
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
    identities: [{ provider: 'google' }, { provider: 'github' }],
  } as User;
}

function githubOnlyUser(): User {
  return {
    id: 'user-1',
    email: 'hero@example.com',
    app_metadata: { provider: 'github' },
    identities: [{ provider: 'github' }],
  } as User;
}

function accessToken(
  sessionId: string,
  amr?: { method: string; timestamp: number }[],
  issuedAt = 1_700_000_000,
): string {
  const claims = amr ?? [{ method: 'oauth', timestamp: issuedAt }];
  const header = Buffer.from(JSON.stringify({ alg: 'none', typ: 'JWT' })).toString('base64url');
  const payload = Buffer.from(
    JSON.stringify({ sub: 'user-1', session_id: sessionId, amr: claims }),
  ).toString('base64url');
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

function installIntentWithVerifier(uid: string, verifier: string, now: number) {
  const intent = mintOAuthDeleteIntent(uid, 'nonce-1', hashPkceCodeVerifier(verifier), now)!;
  cookieGet.mockImplementation((name: string) =>
    name === OAUTH_DELETE_INTENT_COOKIE ? { name, value: intent } : undefined,
  );
  cookieGetAll.mockReturnValue([{ name: PKCE_COOKIE_NAME, value: verifier }]);
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
    cookieGetAll.mockReturnValue([]);
    stubSupabaseClient();
  });

  it('mints an OAuth delete grant when intent, pkce verifier, and oauth amr align', async () => {
    installIntentWithVerifier('user-1', GOOGLE_VERIFIER, now);

    exchangeCodeForSession.mockResolvedValue({
      data: {
        user: googleUser(),
        session: { access_token: accessToken('sess-delete', undefined, now) },
      },
      error: null,
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

  it('does not mint when the pkce verifier does not match the intent (e.g. other provider overwrote it)', async () => {
    installIntentWithVerifier('user-1', GOOGLE_VERIFIER, now);
    cookieGetAll.mockReturnValue([{ name: PKCE_COOKIE_NAME, value: OTHER_VERIFIER }]);

    exchangeCodeForSession.mockResolvedValue({
      data: {
        user: googleUser(),
        session: {
          access_token: accessToken('sess-delete', [{ method: 'oauth', timestamp: now + 5 }]),
        },
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

  it('does not mint a grant when the reauth intent cookie is missing', async () => {
    cookieGetAll.mockReturnValue([{ name: PKCE_COOKIE_NAME, value: GOOGLE_VERIFIER }]);
    exchangeCodeForSession.mockResolvedValue({
      data: {
        user: googleUser(),
        session: { access_token: accessToken('sess-delete', undefined, now) },
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
    installIntentWithVerifier('other-user', GOOGLE_VERIFIER, now);
    exchangeCodeForSession.mockResolvedValue({
      data: {
        user: googleUser(),
        session: { access_token: accessToken('sess-delete', undefined, now) },
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

  it('does not mint when the exchange is not a linked Google account', async () => {
    installIntentWithVerifier('user-1', GOOGLE_VERIFIER, now);
    exchangeCodeForSession.mockResolvedValue({
      data: {
        user: githubOnlyUser(),
        session: { access_token: accessToken('sess-delete', undefined, now) },
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

  it('does not mint when the access token lacks a fresh oauth amr entry', async () => {
    installIntentWithVerifier('user-1', GOOGLE_VERIFIER, now);
    exchangeCodeForSession.mockResolvedValue({
      data: {
        user: googleUser(),
        session: {
          access_token: accessToken('sess-delete', [{ method: 'password', timestamp: now + 5 }]),
        },
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

  it('clears the intent cookie when code exchange fails', async () => {
    installIntentWithVerifier('user-1', GOOGLE_VERIFIER, now);
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
    expect(response.cookies.get(OAUTH_DELETE_INTENT_COOKIE)?.value ?? '').toBe('');
    expect(response.cookies.get(OAUTH_DELETE_GRANT_COOKIE)).toBeUndefined();
  });

  it('does not mint an OAuth delete grant for an ordinary OAuth sign-in', async () => {
    installIntentWithVerifier('user-1', GOOGLE_VERIFIER, now);
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
