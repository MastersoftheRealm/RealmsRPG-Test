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
import { USER_LIBRARY_COLUMNAR_TABLES } from '@/lib/library-columnar-keys';

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

  it('species list maps with rowToItemSpecies and prefers the name column over legacy data.name', async () => {
    mockGetSession.mockResolvedValue({
      user: { uid: 'user-1', email: 'user@example.com' },
      error: null,
    });

    const speciesRow = {
      id: 'sp-col',
      user_id: 'user-1',
      name: 'Column Name',
      description: '',
      type: '',
      payload: {},
      // Legacy shape that must not drive GET mapping (no `data` column in DB).
      data: { name: 'Stale JSON Name' },
    };

    mockCreateClient.mockResolvedValue({
      from: vi.fn((table: string) => {
        if (table !== 'user_species') throw new Error(`Unexpected table: ${table}`);
        return {
          select: vi.fn(() => ({
            eq: vi.fn(async () => ({ data: [speciesRow], error: null })),
          })),
        };
      }),
    } as never);

    const response = await GET(new NextRequest('http://localhost/api/user/library/species'), {
      params: Promise.resolve({ type: 'species' }),
    });

    expect(response.status).toBe(200);
    const body = await readJson<Array<{ id: string; name: string }>>(response);
    expect(body).toHaveLength(1);
    expect(body[0]?.name).toBe('Column Name');
  });

  it('lists columnar powers through USER_LIBRARY_COLUMNAR_TABLES', async () => {
    mockGetSession.mockResolvedValue({
      user: { uid: 'user-1', email: 'user@example.com' },
      error: null,
    });

    const fromTables: string[] = [];
    const probeTable = 'user_powers_shared_map_probe_api_021';
    const previousPowersTable = USER_LIBRARY_COLUMNAR_TABLES.powers;
    USER_LIBRARY_COLUMNAR_TABLES.powers = probeTable;

    try {
      mockCreateClient.mockResolvedValue({
        from: vi.fn((table: string) => {
          fromTables.push(table);
          return {
            select: vi.fn(() => ({
              eq: vi.fn(async () => ({
                data: [
                  {
                    id: 'pow-1',
                    user_id: 'user-1',
                    name: 'Probe power',
                    payload: {},
                  },
                ],
                error: null,
              })),
            })),
          };
        }),
      } as never);

      const response = await GET(new NextRequest('http://localhost/api/user/library/powers'), {
        params: Promise.resolve({ type: 'powers' }),
      });

      expect(response.status).toBe(200);
      expect(fromTables).toEqual([probeTable]);
    } finally {
      USER_LIBRARY_COLUMNAR_TABLES.powers = previousPowersTable;
    }
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
  const libraryRpcKinds: string[] = [];

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

    throw new Error(`Unexpected table: ${table}`);
  });

  const rpc = vi.fn(async (name: string, args: Record<string, unknown>) => {
    if (name === 'insert_user_library_row_with_quota') {
      libraryRpcKinds.push(String(args.p_library_kind));
      return { data: { id: 'rpc-insert-id' }, error: null };
    }
    return { data: null, error: { message: `Unexpected RPC: ${name}` } };
  });

  return { from, rpc, profileWrites, libraryRpcKinds };
}

function makeCreateRequest(type: string, body: Record<string, unknown> = { name: 'New entry' }) {
  return new NextRequest(`http://localhost/api/user/library/${type}`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      origin: 'http://localhost',
    },
    body: JSON.stringify(body),
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
      expect(client.libraryRpcKinds).toEqual([type]);
    },
  );

  it('creates a creature when the payload includes stamped skill objects', async () => {
    const client = createCreateClient({ profileExists: true });
    mockCreateClient.mockResolvedValue(client as never);
    const body = {
      name: 'Stamped ranger',
      level: 1,
      archetypeType: 'power',
      skills: [{ name: 'Athletics', value: 3, proficient: true }],
      syncMeta: { dependencyFingerprint: 'fp1', syncedAt: '2026-01-01T00:00:00.000Z' },
    };

    const response = await POST(makeCreateRequest('creatures', body), {
      params: Promise.resolve({ type: 'creatures' }),
    });

    expect(response.status).toBe(200);
    expect(client.libraryRpcKinds).toEqual(['creatures']);
  });

  it('returns 400 for malformed creature skills without inserting', async () => {
    const client = createCreateClient({ profileExists: true });
    mockCreateClient.mockResolvedValue(client as never);

    const response = await POST(
      makeCreateRequest('creatures', {
        name: 'Bad skills',
        skills: [{ name: 'Athletics', value: 2, proficient: 'yes' }],
      }),
      { params: Promise.resolve({ type: 'creatures' }) },
    );

    expect(response.status).toBe(400);
    expect(client.libraryRpcKinds).toEqual([]);
  });

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
    expect(client.libraryRpcKinds).toEqual(['powers']);
  });
});
