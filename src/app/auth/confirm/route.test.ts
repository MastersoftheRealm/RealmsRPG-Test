import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { User } from '@supabase/supabase-js';

const {
  exchangeCodeForSession,
  verifyOtp,
  cookieSet,
  createServerClient,
  createUserProfileAction,
} = vi.hoisted(() => ({
  exchangeCodeForSession: vi.fn(),
  verifyOtp: vi.fn(),
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

const originalEnv = process.env;

function confirmedUser(metadata: User['user_metadata']): User {
  return {
    id: 'user-1',
    email: 'new@example.com',
    user_metadata: metadata,
    app_metadata: {},
    aud: 'authenticated',
    created_at: '2026-10-10T00:00:00.000Z',
  } as User;
}

function confirmRequest(query: string, headers?: HeadersInit) {
  return new Request(
    `http://localhost/auth/confirm${query}`,
    headers === undefined ? undefined : { headers },
  );
}

describe('GET /auth/confirm', () => {
  let cookieAdapter: {
    setAll: (cookiesToSet: { name: string; value: string; options?: object }[]) => void;
  };

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = {
      ...originalEnv,
      NEXT_PUBLIC_SUPABASE_URL: 'https://test.supabase.co',
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY: 'test-publishable-key',
    };
    createServerClient.mockImplementation(
      (
        _url: string,
        _key: string,
        options: {
          cookies: {
            setAll: (cookiesToSet: { name: string; value: string; options?: object }[]) => void;
          };
        },
      ) => {
        cookieAdapter = options.cookies;
        return {
          auth: {
            exchangeCodeForSession,
            verifyOtp,
          },
        };
      },
    );
    createUserProfileAction.mockResolvedValue({ success: true });
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('exchanges a PKCE code and keeps the username chosen at sign-up', async () => {
    exchangeCodeForSession.mockImplementation(async (code: string) => {
      expect(code).toBe('pkce-code');
      cookieAdapter.setAll([{ name: 'sb-auth-token', value: 'session', options: { path: '/' } }]);
      return {
        data: { user: confirmedUser({ username_display: '  ChosenName  ' }) },
        error: null,
      };
    });

    const response = await GET(confirmRequest('?code=pkce-code&next=%2Fmy-account'));

    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toBe('http://localhost/my-account');
    expect(response.cookies.get('sb-auth-token')?.value).toBe('session');
    expect(cookieSet).toHaveBeenCalledWith('sb-auth-token', 'session', { path: '/' });
    expect(createUserProfileAction).toHaveBeenCalledWith({
      uid: 'user-1',
      email: 'new@example.com',
      username: 'ChosenName',
      displayName: undefined,
    });
    expect(verifyOtp).not.toHaveBeenCalled();
  });

  it('sends a PKCE link to the confirm error when the code cannot be exchanged', async () => {
    exchangeCodeForSession.mockResolvedValue({
      data: { user: null },
      error: { message: 'code verifier not found' },
    });
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const response = await GET(confirmRequest('?code=bad-code&next=%2F'));

    expect(response.headers.get('location')).toBe('http://localhost/login?error=confirm');
    expect(createUserProfileAction).not.toHaveBeenCalled();
    expect(verifyOtp).not.toHaveBeenCalled();
    errorSpy.mockRestore();
  });

  it('sends a link with neither code nor token hash to the confirm error', async () => {
    const response = await GET(confirmRequest('?next=%2F'));

    expect(response.headers.get('location')).toBe('http://localhost/login?error=confirm');
    expect(createServerClient).not.toHaveBeenCalled();
    expect(createUserProfileAction).not.toHaveBeenCalled();
  });

  it('still verifies a token hash link and stores the username', async () => {
    verifyOtp.mockResolvedValue({
      data: { user: confirmedUser({ username: 'TokenName' }) },
      error: null,
    });

    const response = await GET(confirmRequest('?token_hash=hash-1&type=email&next=%2F'));

    expect(response.headers.get('location')).toBe('http://localhost/');
    expect(verifyOtp).toHaveBeenCalledWith({ type: 'email', token_hash: 'hash-1' });
    expect(exchangeCodeForSession).not.toHaveBeenCalled();
    expect(createUserProfileAction).toHaveBeenCalledWith(
      expect.objectContaining({ username: 'TokenName' }),
    );
  });

  it('keeps a successful confirmation off the error page when profile creation fails', async () => {
    exchangeCodeForSession.mockResolvedValue({
      data: { user: confirmedUser({ username_display: 'ChosenName' }) },
      error: null,
    });
    createUserProfileAction.mockResolvedValue({ success: false, error: 'Not authenticated' });
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const response = await GET(confirmRequest('?code=pkce-code&next=%2Freset-password'));

    expect(response.headers.get('location')).toBe('http://localhost/reset-password');
    expect(errorSpy).toHaveBeenCalledWith('Auth confirm profile error:', 'Not authenticated');
    errorSpy.mockRestore();
  });

  it('uses the forwarded host outside local development', async () => {
    exchangeCodeForSession.mockResolvedValue({
      data: { user: confirmedUser({ username_display: 'ChosenName' }) },
      error: null,
    });
    vi.stubEnv('NODE_ENV', 'production');

    const response = await GET(
      confirmRequest('?code=pkce-code&next=%2F', { 'x-forwarded-host': 'realmsrpg.com' }),
    );

    expect(response.headers.get('location')).toBe('https://realmsrpg.com/');
    vi.unstubAllEnvs();
  });
});
