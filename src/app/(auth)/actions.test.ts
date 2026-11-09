import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { defined } from '@/lib/utils';

vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));
vi.mock('next/navigation', () => ({ redirect: vi.fn() }));
const mockCookieGet = vi.fn();
const mockCookieDelete = vi.fn();

vi.mock('next/headers', () => ({
  cookies: vi.fn(async () => ({ get: mockCookieGet, delete: mockCookieDelete })),
  headers: vi.fn(async () => new Headers()),
}));

vi.mock('@/lib/supabase/session', () => ({
  requireAuth: vi.fn(),
  requireLiveUser: vi.fn(),
  getSession: vi.fn(),
}));

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
  createServiceRoleClient: vi.fn(),
}));

vi.mock('@/lib/admin', () => ({ isAdmin: vi.fn(async () => false) }));
vi.mock('@/lib/role-policy', () => ({ getRolePolicyForUser: vi.fn() }));

vi.mock('@/lib/auth/sensitive-account-auth', () => ({
  assertSensitiveAccountReauth: vi.fn(async () => ({ ok: true })),
}));

import {
  changeAccountEmailAction,
  changeAccountPasswordAction,
  changeUsernameAction,
  createUserProfileAction,
  deleteAccountAction,
  setProfilePhotoFromLibraryAction,
} from './actions';
import { OAUTH_DELETE_GRANT_COOKIE } from '@/lib/auth/oauth-delete-grant-core';
import { OAUTH_DELETE_REAUTH_REQUIRED } from '@/lib/auth/oauth-delete-messages';
import { mintOAuthDeleteGrant } from '@/lib/auth/oauth-delete-grant-core';
import { assertSensitiveAccountReauth } from '@/lib/auth/sensitive-account-auth';
import { requireAuth, requireLiveUser, getSession } from '@/lib/supabase/session';
import { createClient as createServerClient, createServiceRoleClient } from '@/lib/supabase/server';

const mockRequireAuth = vi.mocked(requireAuth);
const mockRequireLiveUser = vi.mocked(requireLiveUser);
const mockGetSession = vi.mocked(getSession);
const mockCreateServerClient = vi.mocked(createServerClient);
const mockCreateServiceRoleClient = vi.mocked(createServiceRoleClient);
const mockAssertSensitiveAccountReauth = vi.mocked(assertSensitiveAccountReauth);

const mockAuthGetUser = vi.fn();
const mockAuthGetSession = vi.fn();
const mockAuthUpdateUser = vi.fn();

function accessToken(sessionId: string): string {
  const header = Buffer.from(JSON.stringify({ alg: 'none', typ: 'JWT' })).toString('base64url');
  const payload = Buffer.from(JSON.stringify({ sub: USER.uid, session_id: sessionId })).toString(
    'base64url',
  );
  return `${header}.${payload}.sig`;
}

function useStub(client: unknown) {
  mockCreateServerClient.mockResolvedValue(client as never);
  mockCreateServiceRoleClient.mockReturnValue(client as never);
}

function useAuthMutationClient(dbClient: unknown) {
  const client = {
    ...(dbClient as object),
    auth: {
      getUser: mockAuthGetUser,
      getSession: mockAuthGetSession,
      updateUser: mockAuthUpdateUser,
      admin: { deleteUser: vi.fn(async () => ({ data: null, error: null })) },
    },
  };
  useStub(client);
}

const USER = { uid: 'user-1', email: 'hero@example.com' };
const UNIQUE_VIOLATION = { code: '23505', message: 'duplicate key value' };
const FK_VIOLATION = { code: '23503', message: 'foreign key violation' };

type QueryResult = {
  data: unknown;
  error: { code?: string | undefined; message?: string | undefined } | null;
};
type Action = 'select' | 'insert' | 'update' | 'upsert' | 'delete';

interface Op {
  table: string;
  action: Action;
  payload?: unknown | undefined;
  filters: Record<string, string>;
}

/** Chainable PostgREST-shaped stub that records every executed statement. */
function createSupabaseStub(handler: (op: Op) => QueryResult) {
  const ops: Op[] = [];

  const build = (table: string, action: Action, payload?: unknown) => {
    const op: Op = { table, action, payload, filters: {} };
    const run = (): QueryResult => {
      ops.push(op);
      return handler(op);
    };
    const builder = {
      select: () => builder,
      eq: (column: string, value: string) => {
        op.filters[column] = value;
        return builder;
      },
      maybeSingle: async () => run(),
      single: async () => run(),
      then: <T>(onFulfilled: (value: QueryResult) => T) => Promise.resolve(run()).then(onFulfilled),
    };
    return builder;
  };

  const client = {
    from: (table: string) => ({
      select: () => build(table, 'select'),
      insert: (payload: unknown) => build(table, 'insert', payload),
      update: (payload: unknown) => build(table, 'update', payload),
      upsert: (payload: unknown) => build(table, 'upsert', payload),
      delete: () => build(table, 'delete'),
    }),
    auth: { admin: { deleteUser: vi.fn(async () => ({ data: null, error: null })) } },
  };

  return { client, ops };
}

const ok = (data: unknown = null): QueryResult => ({ data, error: null });

function opLabels(ops: Op[]): string[] {
  return ops.map((op) => `${op.action}:${op.table}`);
}

beforeEach(() => {
  vi.clearAllMocks();
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key';
  mockRequireAuth.mockResolvedValue(USER as never);
  mockRequireLiveUser.mockResolvedValue(USER as never);
  mockGetSession.mockResolvedValue({ user: USER, error: null } as never);
  mockAssertSensitiveAccountReauth.mockResolvedValue({ ok: true });
  mockCookieGet.mockReturnValue(undefined);
  mockAuthGetUser.mockResolvedValue({
    data: { user: { id: USER.uid, email: USER.email } },
    error: null,
  });
  mockAuthGetSession.mockResolvedValue({ data: { session: null }, error: null });
  mockAuthUpdateUser.mockResolvedValue({ error: null });
});

describe('changeUsernameAction', () => {
  it('reports a taken username instead of returning success', async () => {
    const { client, ops } = createSupabaseStub((op) => {
      if (op.table === 'user_profiles' && op.action === 'select') {
        return ok({ username: 'oldname', last_username_change: null });
      }
      // Someone else holds the name: the claim conflicts and RLS hides their row.
      if (op.table === 'usernames' && op.action === 'insert') {
        return { data: null, error: UNIQUE_VIOLATION };
      }
      if (op.table === 'usernames' && op.action === 'select') return ok(null);
      return ok();
    });
    useStub(client);

    const result = await changeUsernameAction('TakenName');

    expect(result).toEqual({ success: false, error: 'This username is already taken' });
    // The old mapping must survive a failed rename.
    expect(opLabels(ops)).not.toContain('delete:usernames');
    expect(opLabels(ops)).not.toContain('update:user_profiles');
  });

  it('claims the new mapping before releasing the old one', async () => {
    const { client, ops } = createSupabaseStub((op) => {
      if (op.table === 'user_profiles' && op.action === 'select') {
        return ok({ username: 'oldname', last_username_change: null });
      }
      return ok();
    });
    useStub(client);

    const result = await changeUsernameAction('NewName');

    expect(result).toEqual({ success: true });
    expect(opLabels(ops)).toEqual([
      'select:user_profiles',
      'insert:usernames',
      'update:user_profiles',
      'delete:usernames',
    ]);
    expect(defined(ops[1]).payload).toEqual({ username: 'newname', user_id: USER.uid });
    expect(defined(ops[3]).filters).toEqual({ username: 'oldname', user_id: USER.uid });
  });

  it('releases the reserved name when the profile update hits the unique index', async () => {
    const { client, ops } = createSupabaseStub((op) => {
      if (op.table === 'user_profiles' && op.action === 'select') {
        return ok({ username: 'oldname', last_username_change: null });
      }
      if (op.table === 'user_profiles' && op.action === 'update') {
        return { data: null, error: UNIQUE_VIOLATION };
      }
      return ok();
    });
    useStub(client);

    const result = await changeUsernameAction('NewName');

    expect(result).toEqual({ success: false, error: 'This username is already taken' });
    const released = ops.find((op) => op.action === 'delete' && op.table === 'usernames');
    expect(released?.filters).toEqual({ username: 'newname', user_id: USER.uid });
    // The previous mapping is untouched.
    expect(
      ops.filter((op) => op.action === 'delete' && op.filters.username === 'oldname'),
    ).toHaveLength(0);
  });

  it('rejects renaming to the current username', async () => {
    const { client } = createSupabaseStub((op) =>
      op.table === 'user_profiles' && op.action === 'select'
        ? ok({ username: 'samename', last_username_change: null })
        : ok(),
    );
    useStub(client);

    const result = await changeUsernameAction('SameName');

    expect(result.success).toBe(false);
  });

  it('does not write when the 7-day cooldown has not elapsed', async () => {
    const { client, ops } = createSupabaseStub((op) =>
      op.table === 'user_profiles' && op.action === 'select'
        ? ok({ username: 'oldname', last_username_change: new Date().toISOString() })
        : ok(),
    );
    useStub(client);

    const result = await changeUsernameAction('NewName');

    expect(result.success).toBe(false);
    expect(opLabels(ops)).toEqual(['select:user_profiles']);
  });

  it('does not write a username that fails the rules', async () => {
    const { client, ops } = createSupabaseStub(() => ok());
    useStub(client);

    const result = await changeUsernameAction('no spaces');

    expect(result.success).toBe(false);
    expect(ops).toEqual([]);
  });
});

describe('setProfilePhotoFromLibraryAction', () => {
  const portrait = 'https://example.test/storage/v1/object/public/codex-art/library/portrait.png';

  it('rejects a URL that is not a library portrait', async () => {
    const { client, ops } = createSupabaseStub((op) => {
      if (op.table === 'realms_images') return ok(null);
      return ok();
    });
    useStub(client);

    const result = await setProfilePhotoFromLibraryAction('https://evil.example/photo.png');

    expect(result).toEqual({
      success: false,
      error: 'Choose a picture from the Realms library.',
    });
    expect(opLabels(ops)).not.toContain('update:user_profiles');
  });

  it('rejects a library image that is not a portrait', async () => {
    const weapon = 'https://example.test/storage/v1/object/public/codex-art/library/sword.png';
    const { client, ops } = createSupabaseStub((op) => {
      if (op.table === 'realms_images' && op.action === 'select') {
        return ok({
          public_url: weapon,
          realms_image_categories: [{ category: 'weapon' }],
        });
      }
      return ok();
    });
    useStub(client);

    const result = await setProfilePhotoFromLibraryAction(weapon);

    expect(result.success).toBe(false);
    expect(opLabels(ops)).not.toContain('update:user_profiles');
  });

  it('stores the library portrait URL, not the caller string', async () => {
    const { client, ops } = createSupabaseStub((op) => {
      if (op.table === 'realms_images' && op.action === 'select') {
        return ok({
          public_url: portrait,
          realms_image_categories: [{ category: 'creature' }],
        });
      }
      return ok();
    });
    useStub(client);

    const result = await setProfilePhotoFromLibraryAction(`${portrait}?t=1`);

    expect(result).toEqual({ success: true, photoUrl: portrait });
    const update = ops.find((op) => op.table === 'user_profiles' && op.action === 'update');
    expect(update?.payload).toMatchObject({ photo_url: portrait });
    expect(update?.filters).toEqual({ id: USER.uid });
  });
});

describe('createUserProfileAction', () => {
  it('retries a generated username when the insert collides', async () => {
    let profileUpdateAttempts = 0;
    const { client, ops } = createSupabaseStub((op) => {
      if (op.table === 'user_profiles' && op.action === 'select') return ok(null);
      if (op.table === 'user_profiles' && op.action === 'update') {
        profileUpdateAttempts += 1;
        return profileUpdateAttempts === 1 ? { data: null, error: UNIQUE_VIOLATION } : ok();
      }
      return ok();
    });
    useStub(client);

    const result = await createUserProfileAction({});

    expect(result).toEqual({ success: true });
    expect(profileUpdateAttempts).toBe(2);
    expect(opLabels(ops)).toEqual([
      'select:user_profiles',
      'insert:user_profiles',
      'insert:usernames',
      'update:user_profiles',
      'delete:usernames',
      'insert:usernames',
      'update:user_profiles',
    ]);
  });

  it('reports a chosen username that is already taken', async () => {
    const { client, ops } = createSupabaseStub((op) => {
      if (op.table === 'user_profiles' && op.action === 'select') return ok(null);
      if (op.table === 'usernames' && op.action === 'insert') {
        return { data: null, error: UNIQUE_VIOLATION };
      }
      if (op.table === 'usernames' && op.action === 'select') {
        return ok({ user_id: 'other-user' });
      }
      return ok();
    });
    useStub(client);

    const result = await createUserProfileAction({ username: 'TakenName' });

    expect(result).toEqual({ success: false, error: 'This username is already taken' });
    const shell = ops.find((op) => op.table === 'user_profiles' && op.action === 'insert');
    expect(shell?.payload).not.toHaveProperty('username');
    expect(opLabels(ops)).not.toContain('update:user_profiles');
  });

  it('does not clear display_name when displayName is omitted on update (PAGES1-001)', async () => {
    const { client, ops } = createSupabaseStub((op) => {
      if (op.table === 'user_profiles' && op.action === 'select') {
        return ok({
          id: USER.uid,
          username: 'chosenname',
          username_display: 'ChosenName',
          display_name: 'Kept Name',
        });
      }
      return ok();
    });
    useStub(client);

    const result = await createUserProfileAction({});

    expect(result).toEqual({ success: true });
    const profileUpdate = ops.find((op) => op.table === 'user_profiles' && op.action === 'update');
    expect(profileUpdate?.payload).not.toHaveProperty('display_name');
  });

  it('rejects an over-long display name', async () => {
    const { client } = createSupabaseStub((op) => {
      if (op.table === 'user_profiles' && op.action === 'select') return ok(null);
      return ok();
    });
    useStub(client);

    const result = await createUserProfileAction({ displayName: 'a'.repeat(51) });

    expect(result.success).toBe(false);
    expect(result).toMatchObject({ error: expect.stringContaining('at most') });
  });

  it('does not reassign a username row another user already owns (PAGES1-002)', async () => {
    const OTHER_USER = 'other-user';
    const { client, ops } = createSupabaseStub((op) => {
      if (op.table === 'user_profiles' && op.action === 'select') return ok(null);
      if (op.table === 'usernames' && op.action === 'insert') {
        return { data: null, error: UNIQUE_VIOLATION };
      }
      if (op.table === 'usernames' && op.action === 'select') {
        return ok({ user_id: OTHER_USER });
      }
      return ok();
    });
    useStub(client);

    const result = await createUserProfileAction({ username: 'TakenName' });

    expect(result).toEqual({ success: false, error: 'This username is already taken' });
    expect(opLabels(ops)).toEqual([
      'select:user_profiles',
      'insert:user_profiles',
      'insert:usernames',
      'select:usernames',
    ]);
    expect(opLabels(ops)).not.toContain('update:user_profiles');
    expect(opLabels(ops)).not.toContain('upsert:usernames');
    expect(opLabels(ops)).not.toContain('update:usernames');
    expect(opLabels(ops)).not.toContain('delete:usernames');
  });

  it('records the username mapping on a successful first claim (PAGES1-002)', async () => {
    let profileShellInserted = false;
    const { client, ops } = createSupabaseStub((op) => {
      if (op.table === 'user_profiles' && op.action === 'select') return ok(null);
      if (op.table === 'user_profiles' && op.action === 'insert') {
        profileShellInserted = true;
        return ok();
      }
      if (op.table === 'usernames' && op.action === 'insert') {
        if (!profileShellInserted) return { data: null, error: FK_VIOLATION };
        return ok();
      }
      return ok();
    });
    useStub(client);

    const result = await createUserProfileAction({ username: 'NewPlayer' });

    expect(result).toEqual({ success: true });
    const shell = ops.find((op) => op.table === 'user_profiles' && op.action === 'insert');
    expect(shell?.payload).not.toHaveProperty('username');
    const claim = ops.find((op) => op.table === 'usernames' && op.action === 'insert');
    expect(claim?.payload).toEqual({ username: 'newplayer', user_id: USER.uid });
    const profileUpdate = ops.find((op) => op.table === 'user_profiles' && op.action === 'update');
    expect(profileUpdate?.payload).toMatchObject({
      username: 'newplayer',
      username_display: 'NewPlayer',
    });
    expect(opLabels(ops)).not.toContain('upsert:usernames');
    expect(opLabels(ops)).toEqual([
      'select:user_profiles',
      'insert:user_profiles',
      'insert:usernames',
      'update:user_profiles',
    ]);
  });

  it('succeeds when the mapping row already belongs to this user (PAGES1-002)', async () => {
    const { client, ops } = createSupabaseStub((op) => {
      if (op.table === 'user_profiles' && op.action === 'select') {
        return ok({
          id: USER.uid,
          username: 'chosenname',
          username_display: 'ChosenName',
        });
      }
      if (op.table === 'usernames' && op.action === 'insert') {
        return { data: null, error: UNIQUE_VIOLATION };
      }
      if (op.table === 'usernames' && op.action === 'select') {
        return ok({ user_id: USER.uid });
      }
      return ok();
    });
    useStub(client);

    const result = await createUserProfileAction({});

    expect(result).toEqual({ success: true });
    expect(opLabels(ops)).toEqual([
      'select:user_profiles',
      'insert:usernames',
      'select:usernames',
      'update:user_profiles',
    ]);
    expect(ops[1]).toMatchObject({ table: 'usernames', action: 'insert' });
    expect(ops[2]).toMatchObject({
      table: 'usernames',
      action: 'select',
      filters: { username: 'chosenname' },
    });
    expect(opLabels(ops)).not.toContain('upsert:usernames');
    expect(opLabels(ops)).not.toContain('update:usernames');
    expect(opLabels(ops)).not.toContain('delete:usernames');
  });

  it('never overwrites an existing username', async () => {
    const { client, ops } = createSupabaseStub((op) => {
      if (op.table === 'user_profiles' && op.action === 'select') {
        return ok({ id: USER.uid, username: 'chosenname', username_display: 'ChosenName' });
      }
      return ok();
    });
    useStub(client);

    const result = await createUserProfileAction({ username: 'SomethingElse' });

    expect(result).toEqual({ success: true });
    const profileUpdate = ops.find((op) => op.table === 'user_profiles' && op.action === 'update');
    expect(profileUpdate?.payload).not.toHaveProperty('username');
    // The usernames mapping stays in step with the profile, not the request.
    const claim = ops.find((op) => op.table === 'usernames');
    expect(claim?.payload).toEqual({ username: 'chosenname', user_id: USER.uid });
  });
});

describe('sensitive account action boundaries', () => {
  it('does not delete when re-auth rejects', async () => {
    mockAssertSensitiveAccountReauth.mockResolvedValueOnce({
      ok: false,
      error: 'Current password is incorrect',
    });
    const { client } = createSupabaseStub(() => ok());
    useStub(client);

    const result = await deleteAccountAction({ currentPassword: 'wrong' });

    expect(result).toEqual({ success: false, error: 'Current password is incorrect' });
    expect(mockRequireLiveUser).not.toHaveBeenCalled();
    expect(mockCreateServiceRoleClient).not.toHaveBeenCalled();
    expect(client.auth.admin.deleteUser).not.toHaveBeenCalled();
  });

  it('does not change email when re-auth rejects', async () => {
    mockAssertSensitiveAccountReauth.mockResolvedValueOnce({
      ok: false,
      error: 'Current password is incorrect',
    });
    useAuthMutationClient({ from: vi.fn() });

    const result = await changeAccountEmailAction('new@example.com', 'wrong');

    expect(result).toEqual({ success: false, error: 'Current password is incorrect' });
    expect(mockAuthGetUser).not.toHaveBeenCalled();
    expect(mockAuthUpdateUser).not.toHaveBeenCalled();
  });

  it('does not change password when re-auth rejects', async () => {
    mockAssertSensitiveAccountReauth.mockResolvedValueOnce({
      ok: false,
      error: 'Current password is incorrect',
    });
    useAuthMutationClient({ from: vi.fn() });

    const result = await changeAccountPasswordAction('wrong', 'new-secret');

    expect(result).toEqual({ success: false, error: 'Current password is incorrect' });
    expect(mockAuthGetUser).not.toHaveBeenCalled();
    expect(mockAuthUpdateUser).not.toHaveBeenCalled();
  });
});

describe('changeAccountEmailAction', () => {
  it('updates email only after live user matches the session', async () => {
    useAuthMutationClient({ from: vi.fn() });

    const result = await changeAccountEmailAction('New@Example.com', 'current');

    expect(result).toEqual({ success: true });
    expect(mockAuthGetUser).toHaveBeenCalled();
    expect(mockAuthUpdateUser).toHaveBeenCalledWith({ email: 'new@example.com' });
  });

  it('does not update email when getUser fails', async () => {
    mockAuthGetUser.mockResolvedValueOnce({
      data: { user: null },
      error: { message: 'JWT expired' },
    });
    useAuthMutationClient({ from: vi.fn() });

    const result = await changeAccountEmailAction('new@example.com', 'current');

    expect(result).toEqual({ success: false, error: 'Authentication required' });
    expect(mockAuthUpdateUser).not.toHaveBeenCalled();
  });

  it('does not update email when the live user id does not match the session', async () => {
    mockAuthGetUser.mockResolvedValueOnce({
      data: { user: { id: 'other-user', email: 'other@example.com' } },
      error: null,
    });
    useAuthMutationClient({ from: vi.fn() });

    const result = await changeAccountEmailAction('new@example.com', 'current');

    expect(result).toEqual({ success: false, error: 'Authentication required' });
    expect(mockAuthUpdateUser).not.toHaveBeenCalled();
  });
});

describe('changeAccountPasswordAction', () => {
  it('updates password only after live user matches the session', async () => {
    useAuthMutationClient({ from: vi.fn() });

    const result = await changeAccountPasswordAction('current', 'new-secret');

    expect(result).toEqual({ success: true });
    expect(mockAuthGetUser).toHaveBeenCalled();
    expect(mockAuthUpdateUser).toHaveBeenCalledWith({ password: 'new-secret' });
  });

  it('does not update password when getUser fails', async () => {
    mockAuthGetUser.mockResolvedValueOnce({
      data: { user: null },
      error: { message: 'JWT expired' },
    });
    useAuthMutationClient({ from: vi.fn() });

    const result = await changeAccountPasswordAction('current', 'new-secret');

    expect(result).toEqual({ success: false, error: 'Authentication required' });
    expect(mockAuthUpdateUser).not.toHaveBeenCalled();
  });

  it('does not update password when the live user id does not match the session', async () => {
    mockAuthGetUser.mockResolvedValueOnce({
      data: { user: { id: 'other-user', email: 'other@example.com' } },
      error: null,
    });
    useAuthMutationClient({ from: vi.fn() });

    const result = await changeAccountPasswordAction('current', 'new-secret');

    expect(result).toEqual({ success: false, error: 'Authentication required' });
    expect(mockAuthUpdateUser).not.toHaveBeenCalled();
  });
});

describe('deleteAccountAction', () => {
  it('does not delete anything when the live user check fails', async () => {
    mockRequireLiveUser.mockRejectedValueOnce(new Error('Authentication required'));
    const { client } = createSupabaseStub(() => ok());
    useStub(client);

    const result = await deleteAccountAction();

    expect(result).toEqual({ success: false, error: 'Failed to delete account' });
    expect(mockCreateServiceRoleClient).not.toHaveBeenCalled();
    expect(client.auth.admin.deleteUser).not.toHaveBeenCalled();
  });

  it('deletes the profile last so its cascade runs, then the auth user', async () => {
    const { client, ops } = createSupabaseStub((op) => {
      if (op.table === 'campaign_members' && op.action === 'select') return ok([]);
      return ok();
    });
    useStub(client);

    const result = await deleteAccountAction();

    expect(result).toEqual({ success: true });
    expect(opLabels(ops)).toEqual([
      'select:campaign_members',
      'delete:campaign_rolls',
      'delete:campaign_members',
      'delete:encounters',
      'delete:campaigns',
      'delete:user_profiles',
    ]);
    expect(client.auth.admin.deleteUser).toHaveBeenCalledWith(USER.uid);
  });

  it('aborts before deleting the auth user when a delete fails', async () => {
    const { client, ops } = createSupabaseStub((op) => {
      if (op.table === 'campaign_members' && op.action === 'select') return ok([]);
      if (op.table === 'encounters') {
        return { data: null, error: { code: '42501', message: 'permission denied' } };
      }
      return ok();
    });
    useStub(client);

    const result = await deleteAccountAction();

    expect(result.success).toBe(false);
    expect(opLabels(ops)).not.toContain('delete:user_profiles');
    expect(client.auth.admin.deleteUser).not.toHaveBeenCalled();
  });

  describe('OAuth-only delete grant', () => {
    const googleUser = {
      id: USER.uid,
      app_metadata: { provider: 'google' },
      identities: [{ provider: 'google' }],
    };

    beforeEach(async () => {
      const actual = await vi.importActual<typeof import('@/lib/auth/sensitive-account-auth')>(
        '@/lib/auth/sensitive-account-auth',
      );
      mockAssertSensitiveAccountReauth.mockImplementation(actual.assertSensitiveAccountReauth);
    });

    afterEach(() => {
      mockAssertSensitiveAccountReauth.mockResolvedValue({ ok: true });
    });

    it('clears the delete grant cookie before re-auth checks', async () => {
      mockCookieGet.mockReturnValue({
        name: OAUTH_DELETE_GRANT_COOKIE,
        value: 'stale-grant',
      });
      mockAssertSensitiveAccountReauth.mockResolvedValue({ ok: false, error: 'fail' });

      await deleteAccountAction({ deleteConfirm: 'DELETE' });

      expect(mockCookieDelete).toHaveBeenCalledWith(OAUTH_DELETE_GRANT_COOKIE);
      expect(mockAssertSensitiveAccountReauth).toHaveBeenCalledWith(
        expect.objectContaining({ oauthDeleteGrantToken: 'stale-grant' }),
      );
    });

    it('does not delete when the grant targets another session for the same user', async () => {
      const now = Math.floor(Date.now() / 1000);
      mockAuthGetUser.mockResolvedValue({ data: { user: googleUser }, error: null });
      mockCookieGet.mockReturnValue({
        name: OAUTH_DELETE_GRANT_COOKIE,
        value: mintOAuthDeleteGrant(USER.uid, 'sess-b', now),
      });
      mockAuthGetSession.mockResolvedValue({
        data: { session: { access_token: accessToken('sess-a') } },
        error: null,
      });
      const { client } = createSupabaseStub(() => ok());
      useAuthMutationClient(client);
      mockCreateServiceRoleClient.mockReturnValue(client as never);

      const result = await deleteAccountAction({ deleteConfirm: 'DELETE' });

      expect(result).toEqual({ success: false, error: OAUTH_DELETE_REAUTH_REQUIRED });
      expect(mockCreateServiceRoleClient).not.toHaveBeenCalled();
      expect(client.auth.admin.deleteUser).not.toHaveBeenCalled();
    });

    it('does not delete after an ordinary refresh with no delete grant', async () => {
      mockAuthGetUser.mockResolvedValue({ data: { user: googleUser }, error: null });
      mockCookieGet.mockReturnValue(undefined);
      mockAuthGetSession.mockResolvedValue({
        data: { session: { access_token: accessToken('sess-a') } },
        error: null,
      });
      const { client } = createSupabaseStub(() => ok());
      useAuthMutationClient(client);
      mockCreateServiceRoleClient.mockReturnValue(client as never);

      const result = await deleteAccountAction({ deleteConfirm: 'DELETE' });

      expect(result).toEqual({ success: false, error: OAUTH_DELETE_REAUTH_REQUIRED });
      expect(mockCreateServiceRoleClient).not.toHaveBeenCalled();
    });

    it('deletes when the session matches a fresh Google delete grant', async () => {
      const now = Math.floor(Date.now() / 1000);
      mockAuthGetUser.mockResolvedValue({ data: { user: googleUser }, error: null });
      mockCookieGet.mockReturnValue({
        name: OAUTH_DELETE_GRANT_COOKIE,
        value: mintOAuthDeleteGrant(USER.uid, 'sess-a', now),
      });
      mockAuthGetSession.mockResolvedValue({
        data: { session: { access_token: accessToken('sess-a') } },
        error: null,
      });
      const { client, ops } = createSupabaseStub((op) => {
        if (op.table === 'campaign_members' && op.action === 'select') return ok([]);
        return ok();
      });
      useAuthMutationClient(client);
      mockCreateServiceRoleClient.mockReturnValue(client as never);

      const result = await deleteAccountAction({ deleteConfirm: 'DELETE' });

      expect(result).toEqual({ success: true });
      expect(mockCreateServiceRoleClient).toHaveBeenCalled();
      expect(opLabels(ops)).toContain('delete:user_profiles');
    });
  });

  it('strips the user from campaign rosters it does not own', async () => {
    const { client, ops } = createSupabaseStub((op) => {
      if (op.table === 'campaign_members' && op.action === 'select') {
        return ok([{ campaign_id: 'camp-1' }]);
      }
      if (op.table === 'campaigns' && op.action === 'select') {
        return ok({
          characters: [
            { userId: USER.uid, characterId: 'char-1' },
            { userId: 'other-user', characterId: 'char-2' },
          ],
        });
      }
      return ok();
    });
    useStub(client);

    const result = await deleteAccountAction();

    expect(result).toEqual({ success: true });
    const rosterUpdate = ops.find((op) => op.table === 'campaigns' && op.action === 'update');
    expect(rosterUpdate?.payload).toEqual({
      characters: [{ userId: 'other-user', characterId: 'char-2' }],
    });
  });
});
