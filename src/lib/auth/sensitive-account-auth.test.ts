import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockRequireLiveUser = vi.fn();
const mockGetUser = vi.fn();
const mockSignInWithPassword = vi.fn();

vi.mock('@/lib/supabase/session', () => ({
  requireLiveUser: (...args: unknown[]) => mockRequireLiveUser(...args),
}));

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(async () => ({
    auth: {
      getUser: mockGetUser,
      signInWithPassword: mockSignInWithPassword,
    },
  })),
}));

import {
  OAUTH_DELETE_FRESH_SIGN_IN_MS,
  OAUTH_DELETE_REAUTH_REQUIRED,
} from '@/lib/auth/oauth-delete-reauth';
import {
  assertSensitiveAccountReauth,
  authUserHasPasswordLogin,
} from '@/lib/auth/sensitive-account-auth';
import type { User } from '@supabase/supabase-js';

function passwordUser(): User {
  return {
    id: 'user-1',
    email: 'hero@example.com',
    app_metadata: { provider: 'email' },
    identities: [{ provider: 'email' }],
  } as User;
}

function oauthUser(lastSignInAt: string): User {
  return {
    id: 'user-1',
    email: 'hero@example.com',
    last_sign_in_at: lastSignInAt,
    app_metadata: { provider: 'google' },
    identities: [{ provider: 'google' }],
  } as User;
}

beforeEach(() => {
  vi.clearAllMocks();
  mockRequireLiveUser.mockResolvedValue({ uid: 'user-1', email: 'hero@example.com' });
});

describe('authUserHasPasswordLogin', () => {
  it('detects email/password accounts', () => {
    expect(authUserHasPasswordLogin(passwordUser())).toBe(true);
    expect(authUserHasPasswordLogin(oauthUser(new Date().toISOString()))).toBe(false);
  });
});

describe('assertSensitiveAccountReauth', () => {
  it('rejects delete without password for email accounts', async () => {
    mockGetUser.mockResolvedValue({ data: { user: passwordUser() }, error: null });

    const result = await assertSensitiveAccountReauth({ deleteConfirm: 'DELETE' });

    expect(result).toEqual({ ok: false, error: 'Current password is incorrect' });
    expect(mockSignInWithPassword).not.toHaveBeenCalled();
  });

  it('rejects a wrong password for email accounts', async () => {
    mockGetUser.mockResolvedValue({ data: { user: passwordUser() }, error: null });
    mockSignInWithPassword.mockResolvedValue({ error: { message: 'bad' } });

    const result = await assertSensitiveAccountReauth({ currentPassword: 'wrong' });

    expect(result).toEqual({ ok: false, error: 'Current password is incorrect' });
  });

  it('accepts a correct password for email accounts', async () => {
    mockGetUser.mockResolvedValue({ data: { user: passwordUser() }, error: null });
    mockSignInWithPassword.mockResolvedValue({ error: null });

    const result = await assertSensitiveAccountReauth({ currentPassword: 'secret' });

    expect(result).toEqual({ ok: true });
    expect(mockSignInWithPassword).toHaveBeenCalledWith({
      email: 'hero@example.com',
      password: 'secret',
    });
  });

  it('accepts typed DELETE for OAuth-only accounts with a fresh sign-in', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: oauthUser(new Date().toISOString()) },
      error: null,
    });

    const result = await assertSensitiveAccountReauth({ deleteConfirm: 'DELETE' });

    expect(result).toEqual({ ok: true });
    expect(mockSignInWithPassword).not.toHaveBeenCalled();
  });

  it('rejects OAuth-only delete when last sign-in is stale', async () => {
    const staleAt = new Date(Date.now() - OAUTH_DELETE_FRESH_SIGN_IN_MS - 1).toISOString();
    mockGetUser.mockResolvedValue({ data: { user: oauthUser(staleAt) }, error: null });

    const result = await assertSensitiveAccountReauth({ deleteConfirm: 'DELETE' });

    expect(result).toEqual({ ok: false, error: OAUTH_DELETE_REAUTH_REQUIRED });
  });

  it('rejects email or password changes for OAuth-only accounts', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: oauthUser(new Date().toISOString()) },
      error: null,
    });

    const result = await assertSensitiveAccountReauth({ currentPassword: 'n/a' });

    expect(result).toEqual({ ok: false, error: 'Current password is incorrect' });
  });
});
