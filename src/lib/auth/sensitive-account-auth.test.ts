import { beforeEach, describe, expect, it, vi } from 'vitest';
import { mintOAuthDeleteGrant } from '@/lib/auth/oauth-delete-grant-core';
import { OAUTH_DELETE_REAUTH_REQUIRED } from '@/lib/auth/oauth-delete-messages';
import {
  assertSensitiveAccountReauth,
  authUserHasPasswordLogin,
} from '@/lib/auth/sensitive-account-auth';
import type { User } from '@supabase/supabase-js';

const mockRequireLiveUser = vi.fn();
const mockGetUser = vi.fn();
const mockGetSession = vi.fn();
const mockSignInWithPassword = vi.fn();
const mockCookieGet = vi.fn();

vi.mock('@/lib/supabase/session', () => ({
  requireLiveUser: (...args: unknown[]) => mockRequireLiveUser(...args),
}));

vi.mock('next/headers', () => ({
  cookies: vi.fn(async () => ({ get: mockCookieGet, delete: vi.fn() })),
}));

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(async () => ({
    auth: {
      getUser: mockGetUser,
      getSession: mockGetSession,
      signInWithPassword: mockSignInWithPassword,
    },
  })),
}));

function passwordUser(): User {
  return {
    id: 'user-1',
    email: 'hero@example.com',
    app_metadata: { provider: 'email' },
    identities: [{ provider: 'email' }],
  } as User;
}

function oauthUser(): User {
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

beforeEach(() => {
  vi.clearAllMocks();
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key';
  mockRequireLiveUser.mockResolvedValue({ uid: 'user-1', email: 'hero@example.com' });
});

describe('authUserHasPasswordLogin', () => {
  it('detects email/password accounts', () => {
    expect(authUserHasPasswordLogin(passwordUser())).toBe(true);
    expect(authUserHasPasswordLogin(oauthUser())).toBe(false);
  });
});

describe('assertSensitiveAccountReauth', () => {
  it('rejects delete without password for email accounts', async () => {
    mockGetUser.mockResolvedValue({ data: { user: passwordUser() }, error: null });

    const result = await assertSensitiveAccountReauth({ deleteConfirm: 'DELETE' });

    expect(result).toEqual({ ok: false, error: 'Current password is incorrect' });
    expect(mockSignInWithPassword).not.toHaveBeenCalled();
  });

  it('forwards the current password verbatim for email re-auth', async () => {
    mockGetUser.mockResolvedValue({ data: { user: passwordUser() }, error: null });
    mockSignInWithPassword.mockResolvedValue({ error: null });

    await assertSensitiveAccountReauth({ currentPassword: '  secret  ' });

    expect(mockSignInWithPassword).toHaveBeenCalledWith({
      email: 'hero@example.com',
      password: '  secret  ',
    });
  });

  it('rejects a wrong password for email accounts', async () => {
    mockGetUser.mockResolvedValue({ data: { user: passwordUser() }, error: null });
    mockSignInWithPassword.mockResolvedValue({ error: { message: 'bad' } });

    const result = await assertSensitiveAccountReauth({ currentPassword: 'wrong' });

    expect(result).toEqual({ ok: false, error: 'Current password is incorrect' });
  });

  it('accepts typed DELETE for OAuth-only accounts with a session-bound delete grant', async () => {
    const now = Math.floor(Date.now() / 1000);
    const grant = mintOAuthDeleteGrant('user-1', 'sess-a', now);
    mockGetUser.mockResolvedValue({ data: { user: oauthUser() }, error: null });
    mockGetSession.mockResolvedValue({
      data: { session: { access_token: accessToken('sess-a') } },
      error: null,
    });

    const result = await assertSensitiveAccountReauth({
      deleteConfirm: 'DELETE',
      oauthDeleteGrantToken: grant ?? undefined,
    });

    expect(result).toEqual({ ok: true });
    expect(mockSignInWithPassword).not.toHaveBeenCalled();
  });

  it('rejects OAuth-only delete without a session-bound delete grant', async () => {
    mockGetUser.mockResolvedValue({ data: { user: oauthUser() }, error: null });
    mockCookieGet.mockReturnValue(undefined);
    mockGetSession.mockResolvedValue({
      data: { session: { access_token: accessToken('sess-a') } },
      error: null,
    });

    const result = await assertSensitiveAccountReauth({ deleteConfirm: 'DELETE' });

    expect(result).toEqual({ ok: false, error: OAUTH_DELETE_REAUTH_REQUIRED });
  });

  it('rejects email or password changes for OAuth-only accounts', async () => {
    mockGetUser.mockResolvedValue({ data: { user: oauthUser() }, error: null });

    const result = await assertSensitiveAccountReauth({ currentPassword: 'n/a' });

    expect(result).toEqual({ ok: false, error: 'Current password is incorrect' });
  });
});
