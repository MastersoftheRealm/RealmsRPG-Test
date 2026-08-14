import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/lib/supabase/session', () => ({
  getSession: vi.fn(),
}));

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}));

// collectCharacterLibraryRefIds stays real: the scoping it produces is the P0 fix.
vi.mock('@/lib/owner-library-for-view', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/owner-library-for-view')>();
  return {
    ...actual,
    getOwnerLibraryForView: vi.fn(),
  };
});

vi.mock('@/lib/rate-limit', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/rate-limit')>();
  return {
    ...actual,
    standardLimiter: {
      check: vi.fn(() => Promise.resolve({ success: true, remaining: 29, reset: Date.now() + 60_000 })),
    },
  };
});

// verifyMutationRequest stays real so the same-origin guard is exercised.
vi.mock('@/lib/api-validation', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/api-validation')>();
  return {
    ...actual,
    validateJson: vi.fn(),
    characterUpdateSchema: {},
  };
});

vi.mock('@/lib/character-save', () => ({
  prepareCharacterForSave: vi.fn((data: unknown) => data),
}));

vi.mock('@/lib/character-list-columns', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/character-list-columns')>();
  return {
    ...actual,
    getCharacterListColumns: vi.fn(() => ({})),
  };
});

vi.mock('@/lib/game/archetype-display', () => ({
  fetchArchetypeNameMap: vi.fn(() => Promise.resolve(new Map())),
}));

import { GET, PATCH, DELETE } from './route';
import { getSession } from '@/lib/supabase/session';
import { createClient } from '@/lib/supabase/server';
import { getOwnerLibraryForView } from '@/lib/owner-library-for-view';
import { validateJson } from '@/lib/api-validation';
import { standardLimiter } from '@/lib/rate-limit';

const mockGetSession = vi.mocked(getSession);
const mockCreateClient = vi.mocked(createClient);
const mockGetOwnerLibraryForView = vi.mocked(getOwnerLibraryForView);
const mockValidateJson = vi.mocked(validateJson);
const mockStandardLimiterCheck = vi.mocked(standardLimiter.check);

const OWNER = { uid: 'owner-user', email: 'owner@example.com' };
const OTHER = { uid: 'other-user', email: 'other@example.com' };

type CharacterRow = {
  id: string;
  user_id: string;
  data: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  visibility?: string | null;
};

function makeCharacterRow(
  id: string,
  userId: string,
  overrides: Partial<CharacterRow['data']> = {},
  column?: { visibility?: string | null }
): CharacterRow {
  const data = { name: 'Test Hero', level: 1, visibility: 'private', ...overrides };
  return {
    id,
    user_id: userId,
    data,
    created_at: '2026-07-01T12:00:00.000Z',
    updated_at: '2026-07-01T12:00:00.000Z',
    visibility: column && 'visibility' in column ? column.visibility : (data.visibility as string),
  };
}

function createMockSupabase(characterRow: CharacterRow | null) {
  const buildSelectChain = () => {
    const eqCalls: [string, string][] = [];
    const chain = {
      eq: vi.fn((col: string, val: string) => {
        eqCalls.push([col, val]);
        return chain;
      }),
      maybeSingle: vi.fn(async () => {
        if (!characterRow) return { data: null, error: null };
        const filters = Object.fromEntries(eqCalls);
        if (filters.id && filters.id !== characterRow.id) {
          return { data: null, error: null };
        }
        if (filters.user_id && filters.user_id !== characterRow.user_id) {
          return { data: null, error: null };
        }
        return { data: characterRow, error: null };
      }),
    };
    return chain;
  };

  const lastUpdate: { payload: Record<string, unknown> | null } = { payload: null };

  const buildUpdateChain = (payload: Record<string, unknown>) => {
    lastUpdate.payload = payload;
    const eqCalls: [string, string][] = [];
    const chain = {
      eq: vi.fn((col: string, val: string) => {
        eqCalls.push([col, val]);
        return chain;
      }),
      select: vi.fn(() => chain),
      maybeSingle: vi.fn(async () => {
        if (!characterRow) return { data: null, error: null };
        const filters = Object.fromEntries(eqCalls);
        if (filters.id && filters.id !== characterRow.id) {
          return { data: null, error: null };
        }
        if (filters.user_id && filters.user_id !== characterRow.user_id) {
          return { data: null, error: null };
        }
        if (filters.updated_at && filters.updated_at !== characterRow.updated_at) {
          return { data: null, error: null };
        }
        return {
          data: {
            id: characterRow.id,
            updated_at: (payload.updated_at as string | undefined) ?? '2026-08-14T00:00:00.000Z',
          },
          error: null,
        };
      }),
    };
    return chain;
  };

  const update = vi.fn((payload: Record<string, unknown>) => buildUpdateChain(payload));

  return {
    lastUpdate,
    update,
    from: vi.fn((table: string) => {
      if (table === 'characters') {
        return {
          select: vi.fn(() => buildSelectChain()),
          update,
          delete: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ error: null }),
            }),
          }),
        };
      }
      if (table === 'campaign_members' || table === 'campaigns') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ data: [], error: null }),
            in: vi.fn().mockResolvedValue({ data: [], error: null }),
          }),
        };
      }
      throw new Error(`Unexpected table: ${table}`);
    }),
    storage: {
      from: vi.fn(() => ({
        list: vi.fn().mockResolvedValue({ data: [], error: null }),
        remove: vi.fn().mockResolvedValue({ error: null }),
      })),
    },
  };
}

function makeGetRequest(id: string) {
  return new NextRequest(`http://localhost/api/characters/${id}`);
}

function makePatchRequest(id: string, body: unknown) {
  return new NextRequest(`http://localhost/api/characters/${id}`, {
    method: 'PATCH',
    headers: {
      'content-type': 'application/json',
      'x-forwarded-for': '203.0.113.1',
      origin: 'http://localhost',
    },
    body: JSON.stringify(body),
  });
}

function makeDeleteRequest(id: string, headers: Record<string, string> = {}) {
  return new NextRequest(`http://localhost/api/characters/${id}`, {
    method: 'DELETE',
    headers: { 'x-forwarded-for': '203.0.113.1', origin: 'http://localhost', ...headers },
  });
}

async function readJson<T>(response: Response): Promise<T> {
  return response.json() as Promise<T>;
}

describe('GET /api/characters/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetOwnerLibraryForView.mockResolvedValue({ powers: [], techniques: [], items: [], creatures: [] });
  });

  it('returns 404 null for a nonexistent character id', async () => {
    mockGetSession.mockResolvedValue({ user: OTHER, error: null });
    mockCreateClient.mockResolvedValue(createMockSupabase(null) as never);

    const response = await GET(makeGetRequest('missing-char-id'), {
      params: Promise.resolve({ id: 'missing-char-id' }),
    });

    expect(response.status).toBe(404);
    await expect(readJson(response)).resolves.toBeNull();
  });

  it('returns 404 null for another users private character (not 403)', async () => {
    const row = makeCharacterRow('char-private', OWNER.uid, { visibility: 'private' });
    mockGetSession.mockResolvedValue({ user: OTHER, error: null });
    mockCreateClient.mockResolvedValue(createMockSupabase(row) as never);

    const response = await GET(makeGetRequest('char-private'), {
      params: Promise.resolve({ id: 'char-private' }),
    });

    expect(response.status).toBe(404);
    await expect(readJson(response)).resolves.toBeNull();
  });

  it('returns 404 null for unauthenticated viewers of a private character (not 403)', async () => {
    const row = makeCharacterRow('char-private', OWNER.uid, { visibility: 'private' });
    mockGetSession.mockResolvedValue({ user: null, error: 'No session' });
    mockCreateClient.mockResolvedValue(createMockSupabase(row) as never);

    const response = await GET(makeGetRequest('char-private'), {
      params: Promise.resolve({ id: 'char-private' }),
    });

    expect(response.status).toBe(404);
    await expect(readJson(response)).resolves.toBeNull();
  });

  it('returns the character for the owner', async () => {
    const row = makeCharacterRow('char-owned', OWNER.uid, { visibility: 'private' });
    mockGetSession.mockResolvedValue({ user: OWNER, error: null });
    mockCreateClient.mockResolvedValue(createMockSupabase(row) as never);

    const response = await GET(makeGetRequest('char-owned'), {
      params: Promise.resolve({ id: 'char-owned' }),
    });

    expect(response.status).toBe(200);
    const body = await readJson<{ character: { id: string; name: string } }>(response);
    expect(body.character.id).toBe('char-owned');
    expect(body.character.name).toBe('Test Hero');
  });

  it('returns public characters to non-owner viewers', async () => {
    const row = makeCharacterRow('char-public', OWNER.uid, { visibility: 'public' });
    mockGetSession.mockResolvedValue({ user: OTHER, error: null });
    mockCreateClient.mockResolvedValue(createMockSupabase(row) as never);
    mockGetOwnerLibraryForView.mockResolvedValue({ powers: [], techniques: [], items: [], creatures: [] });

    const response = await GET(makeGetRequest('char-public'), {
      params: Promise.resolve({ id: 'char-public' }),
    });

    expect(response.status).toBe(200);
    const body = await readJson<{ character: { id: string }; libraryForView: unknown }>(response);
    expect(body.character.id).toBe('char-public');
    expect(body.libraryForView).toEqual({ powers: [], techniques: [], items: [], creatures: [] });
  });

  it('scopes the owner library to the ids the public character references', async () => {
    const row = makeCharacterRow('char-public', OWNER.uid, {
      visibility: 'public',
      powers: [{ id: 'power-1', name: 'Firebolt' }],
      techniques: [{ id: 'technique-1', name: 'Riposte' }],
      equipment: { weapons: [{ id: 'item-1', name: 'Sword' }] },
    });
    mockGetSession.mockResolvedValue({ user: OTHER, error: null });
    mockCreateClient.mockResolvedValue(createMockSupabase(row) as never);

    await GET(makeGetRequest('char-public'), { params: Promise.resolve({ id: 'char-public' }) });

    expect(mockGetOwnerLibraryForView).toHaveBeenCalledWith(OWNER.uid, {
      powers: ['power-1'],
      techniques: ['technique-1'],
      items: ['item-1'],
      creatures: [],
    });
  });

  it('returns 404 when the visibility column is private even if the blob says public', async () => {
    const row = makeCharacterRow(
      'char-desync',
      OWNER.uid,
      { visibility: 'public' },
      { visibility: 'private' }
    );
    mockGetSession.mockResolvedValue({ user: OTHER, error: null });
    mockCreateClient.mockResolvedValue(createMockSupabase(row) as never);

    const response = await GET(makeGetRequest('char-desync'), {
      params: Promise.resolve({ id: 'char-desync' }),
    });

    expect(response.status).toBe(404);
    await expect(readJson(response)).resolves.toBeNull();
    expect(mockGetOwnerLibraryForView).not.toHaveBeenCalled();
  });
});

describe('PATCH /api/characters/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockStandardLimiterCheck.mockResolvedValue({
      success: true,
      remaining: 29,
      reset: Date.now() + 60_000,
    });
    mockValidateJson.mockResolvedValue({
      success: true,
      data: { name: 'Updated Hero' },
    } as never);
  });

  it('returns 401 when session is missing', async () => {
    mockGetSession.mockResolvedValue({ user: null, error: 'No session' });

    const response = await PATCH(makePatchRequest('char-1', { name: 'Updated Hero' }), {
      params: Promise.resolve({ id: 'char-1' }),
    });

    expect(response.status).toBe(401);
    await expect(readJson(response)).resolves.toEqual({ error: 'Unauthorized' });
  });

  it('returns 404 when another user tries to update a character (IDOR)', async () => {
    const row = makeCharacterRow('char-private', OWNER.uid);
    mockGetSession.mockResolvedValue({ user: OTHER, error: null });
    mockCreateClient.mockResolvedValue(createMockSupabase(row) as never);

    const response = await PATCH(makePatchRequest('char-private', { name: 'Stolen' }), {
      params: Promise.resolve({ id: 'char-private' }),
    });

    expect(response.status).toBe(404);
    await expect(readJson(response)).resolves.toEqual({ error: 'Character not found' });
  });

  it('updates the character for the owner', async () => {
    const row = makeCharacterRow('char-owned', OWNER.uid);
    mockGetSession.mockResolvedValue({ user: OWNER, error: null });
    const supabase = createMockSupabase(row);
    mockCreateClient.mockResolvedValue(supabase as never);

    const response = await PATCH(makePatchRequest('char-owned', { name: 'Updated Hero' }), {
      params: Promise.resolve({ id: 'char-owned' }),
    });

    expect(response.status).toBe(200);
    const body = await readJson<{ ok: boolean; updatedAt: string }>(response);
    expect(body.ok).toBe(true);
    expect(body.updatedAt).toBeTruthy();
  });

  it('merges a partial payload and leaves omitted keys intact', async () => {
    const row = makeCharacterRow('char-owned', OWNER.uid, { notes: 'keep me', level: 3 });
    mockGetSession.mockResolvedValue({ user: OWNER, error: null });
    const supabase = createMockSupabase(row);
    mockCreateClient.mockResolvedValue(supabase as never);
    mockValidateJson.mockResolvedValue({
      success: true,
      data: { name: 'Updated Hero' },
    } as never);

    const response = await PATCH(makePatchRequest('char-owned', { name: 'Updated Hero' }), {
      params: Promise.resolve({ id: 'char-owned' }),
    });

    expect(response.status).toBe(200);
    expect(supabase.update).toHaveBeenCalled();
    const payload = supabase.lastUpdate.payload;
    expect(payload).toBeTruthy();
    const data = payload!.data as Record<string, unknown>;
    expect(data.name).toBe('Updated Hero');
    expect(data.notes).toBe('keep me');
    expect(data.level).toBe(3);
    expect(typeof data.updatedAt).toBe('string');
  });

  it('returns 409 and does not write when updatedAt is stale', async () => {
    const row = makeCharacterRow('char-owned', OWNER.uid);
    mockGetSession.mockResolvedValue({ user: OWNER, error: null });
    const supabase = createMockSupabase(row);
    mockCreateClient.mockResolvedValue(supabase as never);
    mockValidateJson.mockResolvedValue({
      success: true,
      data: { name: 'Stale write', updatedAt: '2026-01-01T00:00:00.000Z' },
    } as never);

    const response = await PATCH(
      makePatchRequest('char-owned', { name: 'Stale write', updatedAt: '2026-01-01T00:00:00.000Z' }),
      { params: Promise.resolve({ id: 'char-owned' }) }
    );

    expect(response.status).toBe(409);
    await expect(readJson(response)).resolves.toEqual({ error: 'Character was updated elsewhere' });
    expect(supabase.update).not.toHaveBeenCalled();
  });

  it('applies a matching updatedAt lock and stamps a new token', async () => {
    const row = makeCharacterRow('char-owned', OWNER.uid);
    mockGetSession.mockResolvedValue({ user: OWNER, error: null });
    const supabase = createMockSupabase(row);
    mockCreateClient.mockResolvedValue(supabase as never);
    mockValidateJson.mockResolvedValue({
      success: true,
      data: { notes: 'fresh', updatedAt: row.updated_at },
    } as never);

    const response = await PATCH(
      makePatchRequest('char-owned', { notes: 'fresh', updatedAt: row.updated_at }),
      { params: Promise.resolve({ id: 'char-owned' }) }
    );

    expect(response.status).toBe(200);
    const body = await readJson<{ ok: boolean; updatedAt: string }>(response);
    expect(body.ok).toBe(true);
    expect(body.updatedAt).not.toBe(row.updated_at);
    expect(supabase.lastUpdate.payload?.updated_at).toBeTruthy();
  });
});

describe('DELETE /api/characters/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockStandardLimiterCheck.mockResolvedValue({
      success: true,
      remaining: 29,
      reset: Date.now() + 60_000,
    });
  });

  it('returns 401 when session is missing', async () => {
    mockGetSession.mockResolvedValue({ user: null, error: 'No session' });

    const response = await DELETE(makeDeleteRequest('char-1'), {
      params: Promise.resolve({ id: 'char-1' }),
    });

    expect(response.status).toBe(401);
    await expect(readJson(response)).resolves.toEqual({ error: 'Unauthorized' });
  });

  it('returns 404 when another user tries to delete a character (IDOR)', async () => {
    const row = makeCharacterRow('char-private', OWNER.uid);
    mockGetSession.mockResolvedValue({ user: OTHER, error: null });
    mockCreateClient.mockResolvedValue(createMockSupabase(row) as never);

    const response = await DELETE(makeDeleteRequest('char-private'), {
      params: Promise.resolve({ id: 'char-private' }),
    });

    expect(response.status).toBe(404);
    await expect(readJson(response)).resolves.toEqual({ error: 'Character not found' });
  });

  it('deletes the character for the owner', async () => {
    const row = makeCharacterRow('char-owned', OWNER.uid);
    mockGetSession.mockResolvedValue({ user: OWNER, error: null });
    mockCreateClient.mockResolvedValue(createMockSupabase(row) as never);

    const response = await DELETE(makeDeleteRequest('char-owned'), {
      params: Promise.resolve({ id: 'char-owned' }),
    });

    expect(response.status).toBe(200);
    await expect(readJson(response)).resolves.toEqual({ ok: true });
  });
});
