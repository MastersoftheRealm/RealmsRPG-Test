import { describe, expect, it, vi } from 'vitest';
import { ensureUserProfile } from '@/lib/ensure-user-profile';

const PROFILE_DENIED = {
  code: '42501',
  details: null,
  hint: null,
  message: 'permission denied for table user_profiles',
};

const SESSION_INSERT = new Set(['id', 'display_name', 'created_at', 'updated_at']);

type ProfileWrite = { action: 'insert' | 'upsert' | 'update'; payload: Record<string, unknown> };

/**
 * authenticated column grants after 86e3jt562. Upsert is INSERT ... ON CONFLICT
 * DO UPDATE and fails with 42501 even when the payload only names granted columns,
 * because the conflict update touches id.
 */
function createProfileClient(options: {
  exists: boolean;
  insertError?: { code: string; message: string } | null;
}) {
  const writes: ProfileWrite[] = [];
  let exists = options.exists;

  const from = vi.fn((table: string) => {
    if (table !== 'user_profiles') {
      throw new Error(`unexpected table ${table}`);
    }
    return {
      select: vi.fn((columns: string) => {
        if (columns !== 'id') {
          throw new Error(`unexpected profile select: ${columns}`);
        }
        return {
          eq: vi.fn(() => ({
            maybeSingle: vi.fn(async () => ({
              data: exists ? { id: 'user-1' } : null,
              error: null,
            })),
          })),
        };
      }),
      insert: vi.fn((payload: Record<string, unknown>) => {
        writes.push({ action: 'insert', payload });
        const locked = Object.keys(payload).some((key) => !SESSION_INSERT.has(key));
        const error = locked ? PROFILE_DENIED : (options.insertError ?? null);
        if (!error) exists = true;
        return Promise.resolve({ data: null, error });
      }),
      upsert: vi.fn((payload: Record<string, unknown>) => {
        writes.push({ action: 'upsert', payload });
        return Promise.resolve({ data: null, error: PROFILE_DENIED });
      }),
      update: vi.fn((payload: Record<string, unknown>) => {
        writes.push({ action: 'update', payload });
        return {
          eq: vi.fn(async () => ({ data: null, error: PROFILE_DENIED })),
        };
      }),
    };
  });

  return { client: { from } as never, writes };
}

describe('ensureUserProfile', () => {
  it('does not write when the profile row already exists', async () => {
    const { client, writes } = createProfileClient({ exists: true });

    await ensureUserProfile(client, 'user-1');

    expect(writes).toEqual([]);
  });

  it('inserts only session-writable columns when the profile row is missing', async () => {
    const { client, writes } = createProfileClient({ exists: false });

    await ensureUserProfile(client, 'user-1');

    expect(writes).toHaveLength(1);
    expect(writes[0]?.action).toBe('insert');
    expect(Object.keys(writes[0]?.payload ?? {}).sort()).toEqual(
      ['created_at', 'id', 'updated_at'].sort(),
    );
    expect(writes[0]?.payload.id).toBe('user-1');
  });

  it('treats a concurrent profile insert as success', async () => {
    const { client } = createProfileClient({
      exists: false,
      insertError: { code: '23505', message: 'duplicate key value violates unique constraint' },
    });

    await expect(ensureUserProfile(client, 'user-1')).resolves.toBeUndefined();
  });
});
