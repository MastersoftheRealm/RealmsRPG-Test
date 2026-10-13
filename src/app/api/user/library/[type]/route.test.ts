import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/lib/supabase/session', () => ({
  getSession: vi.fn(),
}));

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}));

vi.mock('@/lib/entity-image-enrich-server', () => ({
  enrichRowsWithBankImageUrls: vi.fn(() => Promise.resolve()),
}));

vi.mock('@/lib/rate-limit', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/rate-limit')>();
  return {
    ...actual,
    standardLimiter: {
      check: vi.fn(() =>
        Promise.resolve({ success: true, remaining: 29, reset: Date.now() + 60_000 }),
      ),
    },
  };
});

import { GET, POST } from './route';
import { getSession } from '@/lib/supabase/session';
import { createClient } from '@/lib/supabase/server';

const mockGetSession = vi.mocked(getSession);
const mockCreateClient = vi.mocked(createClient);

async function readJson<T>(response: Response): Promise<T> {
  return response.json() as Promise<T>;
}

describe('GET /api/user/library/[type]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 when session is missing', async () => {
    mockGetSession.mockResolvedValue({ user: null, error: 'No session' });

    const response = await GET(new NextRequest('http://localhost/api/user/library/powers'), {
      params: Promise.resolve({ type: 'powers' }),
    });

    expect(response.status).toBe(401);
    await expect(readJson(response)).resolves.toEqual({ error: 'Unauthorized' });
  });

  it('species name lookup reads the name column and does not select dropped data', async () => {
    mockGetSession.mockResolvedValue({
      user: { uid: 'user-1', email: 'user@example.com' },
      error: null,
    });

    const select = vi.fn((columns: string) => {
      const chain = {
        eq: vi.fn(async () => {
          // Repro: user_species no longer has a `data` column. Requesting it
          // is the 500 that species save shows as "Failed to load library items".
          if (/(^|,)\s*data\s*(,|$)/.test(columns)) {
            return {
              data: null,
              error: { message: 'column user_species.data does not exist', code: '42703' },
            };
          }
          return {
            data: [
              { id: 'sp-1', name: 'Other' },
              { id: 'sp-2', name: 'Riverfolk' },
            ],
            error: null,
          };
        }),
      };
      return chain;
    });

    mockCreateClient.mockResolvedValue({
      from: vi.fn((table: string) => {
        if (table !== 'user_species') throw new Error(`Unexpected table: ${table}`);
        return { select };
      }),
    } as never);

    const response = await GET(
      new NextRequest('http://localhost/api/user/library/species?name=Riverfolk'),
      { params: Promise.resolve({ type: 'species' }) },
    );

    expect(select).toHaveBeenCalledWith('id, name');
    expect(response.status).toBe(200);
    await expect(readJson(response)).resolves.toEqual([{ id: 'sp-2', name: 'Riverfolk' }]);
  });
});

const PROFILE_DENIED = {
  code: '42501',
  details: null,
  hint: null,
  message: 'permission denied for table user_profiles',
};

/** Columns authenticated may INSERT after 86e3jt562. UPDATE is display_name and updated_at only. */
const SESSION_INSERT = new Set(['id', 'display_name', 'created_at', 'updated_at']);

type ProfileWrite = { action: 'insert' | 'upsert' | 'update'; payload: Record<string, unknown> };

function createCreateClient(options: { profileExists: boolean }) {
  const profileWrites: ProfileWrite[] = [];
  let profileExists = options.profileExists;
  const libraryInserts: string[] = [];

  const from = vi.fn((table: string) => {
    if (table === 'user_profiles') {
      return {
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            maybeSingle: vi.fn(async () => ({
              data: profileExists ? { id: 'user-1', role: 'new_player' } : null,
              error: null,
            })),
          })),
        })),
        insert: vi.fn((payload: Record<string, unknown>) => {
          profileWrites.push({ action: 'insert', payload });
          const locked = Object.keys(payload).some((key) => !SESSION_INSERT.has(key));
          if (!locked) profileExists = true;
          return Promise.resolve({
            data: null,
            error: locked ? PROFILE_DENIED : null,
          });
        }),
        upsert: vi.fn((payload: Record<string, unknown>) => {
          profileWrites.push({ action: 'upsert', payload });
          return Promise.resolve({ data: null, error: PROFILE_DENIED });
        }),
        update: vi.fn((payload: Record<string, unknown>) => {
          profileWrites.push({ action: 'update', payload });
          return {
            eq: vi.fn(async () => ({ data: null, error: PROFILE_DENIED })),
          };
        }),
      };
    }

    if (table === 'role_policies') {
      return {
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            maybeSingle: vi.fn(async () => ({ data: null, error: null })),
          })),
        })),
      };
    }

    return {
      select: vi.fn((_columns: string, query?: { head?: boolean }) => {
        const result = query?.head
          ? { data: null, error: null, count: 0 }
          : { data: [], error: null };
        const filters = {
          eq: vi.fn(() => filters),
          then: (
            resolve: (value: typeof result) => unknown,
            reject?: (reason: unknown) => unknown,
          ) => Promise.resolve(result).then(resolve, reject),
        };
        return filters;
      }),
      insert: vi.fn(async () => {
        libraryInserts.push(table);
        return { data: null, error: null };
      }),
    };
  });

  return { from, profileWrites, libraryInserts };
}

function makeCreateRequest(type: string) {
  return new NextRequest(`http://localhost/api/user/library/${type}`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      origin: 'http://localhost',
    },
    body: JSON.stringify({ name: 'New entry' }),
  });
}

describe('POST /api/user/library/[type]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSession.mockResolvedValue({
      user: { uid: 'user-1', email: 'user@example.com' },
      error: null,
    });
  });

  it.each(['powers', 'items'] as const)(
    'creates a %s when the profile already exists without writing user_profiles',
    async (type) => {
      const client = createCreateClient({ profileExists: true });
      mockCreateClient.mockResolvedValue(client as never);

      const response = await POST(makeCreateRequest(type), {
        params: Promise.resolve({ type }),
      });

      expect(response.status).toBe(200);
      const body = await readJson<{ id: string }>(response);
      expect(body.id).toEqual(expect.any(String));
      expect(client.profileWrites).toEqual([]);
      expect(client.libraryInserts).toEqual([type === 'powers' ? 'user_powers' : 'user_items']);
    },
  );

  it('inserts only granted profile columns when the profile row is missing', async () => {
    const client = createCreateClient({ profileExists: false });
    mockCreateClient.mockResolvedValue(client as never);

    const response = await POST(makeCreateRequest('powers'), {
      params: Promise.resolve({ type: 'powers' }),
    });

    expect(response.status).toBe(200);
    expect(client.profileWrites.map((write) => write.action)).toEqual(['insert']);
    expect(Object.keys(client.profileWrites[0]?.payload ?? {})).toEqual(
      expect.arrayContaining(['id']),
    );
    for (const key of Object.keys(client.profileWrites[0]?.payload ?? {})) {
      expect(SESSION_INSERT.has(key)).toBe(true);
    }
    expect(client.libraryInserts).toEqual(['user_powers']);
  });
});
