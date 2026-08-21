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
}));

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(),
}));

vi.mock('@/lib/admin', () => ({ isAdmin: vi.fn(async () => false) }));
vi.mock('@/lib/role-policy', () => ({ getRolePolicyForUser: vi.fn() }));

import { changeUsernameAction, createUserProfileAction, deleteAccountAction } from './actions';
import { requireAuth, getSession } from '@/lib/supabase/session';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';

const mockRequireAuth = vi.mocked(requireAuth);
const mockGetSession = vi.mocked(getSession);
const mockCreateServerClient = vi.mocked(createServerClient);
const mockCreateServiceClient = vi.mocked(createServiceClient);

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
    mockCreateServerClient.mockResolvedValue(client as never);

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
    mockCreateServerClient.mockResolvedValue(client as never);

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
    mockCreateServerClient.mockResolvedValue(client as never);

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
    mockCreateServerClient.mockResolvedValue(client as never);

    const result = await changeUsernameAction('SameName');

    expect(result.success).toBe(false);
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
    mockCreateServerClient.mockResolvedValue(client as never);

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
    mockCreateServerClient.mockResolvedValue(client as never);

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
    mockCreateServerClient.mockResolvedValue(client as never);

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
    mockCreateServiceClient.mockReturnValue(client as never);

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
    mockCreateServiceClient.mockReturnValue(client as never);

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
    mockCreateServiceClient.mockReturnValue(client as never);

    const result = await deleteAccountAction();

    expect(result).toEqual({ success: true });
    const rosterUpdate = ops.find((op) => op.table === 'campaigns' && op.action === 'update');
    expect(rosterUpdate?.payload).toEqual({
      characters: [{ userId: 'other-user', characterId: 'char-2' }],
    });
  });
});
