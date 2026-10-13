import { beforeEach, describe, expect, it, vi } from 'vitest';
import { defined } from '@/lib/utils';

vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));
vi.mock('next/navigation', () => ({ redirect: vi.fn() }));
vi.mock('next/headers', () => ({ headers: vi.fn(async () => new Headers()) }));

vi.mock('@/lib/supabase/session', () => ({
  requireAuth: vi.fn(),
  getSession: vi.fn(),
}));

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
  createServiceRoleClient: vi.fn(),
}));

vi.mock('@/lib/admin', () => ({ isAdmin: vi.fn(async () => false) }));
vi.mock('@/lib/role-policy', () => ({ getRolePolicyForUser: vi.fn() }));

import {
  changeUsernameAction,
  createUserProfileAction,
  deleteAccountAction,
  setProfilePhotoFromLibraryAction,
} from './actions';
import { requireAuth, getSession } from '@/lib/supabase/session';
import { createClient as createServerClient, createServiceRoleClient } from '@/lib/supabase/server';

const mockRequireAuth = vi.mocked(requireAuth);
const mockGetSession = vi.mocked(getSession);
const mockCreateServerClient = vi.mocked(createServerClient);
const mockCreateServiceRoleClient = vi.mocked(createServiceRoleClient);

function useStub(client: unknown) {
  mockCreateServerClient.mockResolvedValue(client as never);
  mockCreateServiceRoleClient.mockReturnValue(client as never);
}

const USER = { uid: 'user-1', email: 'hero@example.com' };
const UNIQUE_VIOLATION = { code: '23505', message: 'duplicate key value' };

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
  mockRequireAuth.mockResolvedValue(USER as never);
  mockGetSession.mockResolvedValue({ user: USER, error: null } as never);
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
    let insertAttempts = 0;
    const { client, ops } = createSupabaseStub((op) => {
      if (op.table === 'user_profiles' && op.action === 'select') return ok(null);
      if (op.table === 'user_profiles' && op.action === 'insert') {
        insertAttempts += 1;
        return insertAttempts === 1 ? { data: null, error: UNIQUE_VIOLATION } : ok();
      }
      return ok();
    });
    useStub(client);

    const result = await createUserProfileAction({});

    expect(result).toEqual({ success: true });
    expect(insertAttempts).toBe(2);
    expect(opLabels(ops)).toEqual([
      'select:user_profiles',
      'insert:user_profiles',
      'insert:user_profiles',
      'upsert:usernames',
    ]);
  });

  it('reports a chosen username that is already taken', async () => {
    const { client } = createSupabaseStub((op) => {
      if (op.table === 'user_profiles' && op.action === 'select') return ok(null);
      if (op.table === 'user_profiles' && op.action === 'insert') {
        return { data: null, error: UNIQUE_VIOLATION };
      }
      return ok();
    });
    useStub(client);

    const result = await createUserProfileAction({ username: 'TakenName' });

    expect(result).toEqual({ success: false, error: 'This username is already taken' });
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

describe('deleteAccountAction', () => {
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
