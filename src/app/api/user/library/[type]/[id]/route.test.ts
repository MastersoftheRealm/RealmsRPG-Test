import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/lib/supabase/session', () => ({
  getSession: vi.fn(),
}));

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
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

vi.mock('@/lib/entity-image-enrich-server', () => ({
  enrichRowsWithBankImageUrls: vi.fn(() => Promise.resolve()),
}));

vi.mock('@/lib/admin', () => ({
  isAdmin: vi.fn(),
}));

import { GET, PATCH, DELETE } from './route';
import { getSession } from '@/lib/supabase/session';
import { createClient } from '@/lib/supabase/server';
import { standardLimiter } from '@/lib/rate-limit';
import { isAdmin } from '@/lib/admin';

const mockGetSession = vi.mocked(getSession);
const mockCreateClient = vi.mocked(createClient);
const mockStandardLimiterCheck = vi.mocked(standardLimiter.check);
const mockIsAdmin = vi.mocked(isAdmin);

const OWNER = { uid: 'owner-user', email: 'owner@example.com' };
const OTHER = { uid: 'other-user', email: 'other@example.com' };

type LibraryRow = {
  id: string;
  user_id: string;
  name: string;
  payload: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

function makeLibraryRow(id: string, userId: string): LibraryRow {
  return {
    id,
    user_id: userId,
    name: 'Firebolt',
    payload: { parts: [], damage: [] },
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  };
}

function createMockSupabase(row: LibraryRow | null) {
  let lastUpdate: Record<string, unknown> | null = null;
  const updateEqCalls: Array<[string, string]> = [];

  const buildSelectChain = () => {
    const eqCalls: [string, string][] = [];
    const chain = {
      eq: vi.fn((col: string, val: string) => {
        eqCalls.push([col, val]);
        return chain;
      }),
      maybeSingle: vi.fn(async () => {
        if (!row) return { data: null, error: null };
        const filters = Object.fromEntries(eqCalls);
        if (filters.id && filters.id !== row.id) return { data: null, error: null };
        if (filters.user_id && filters.user_id !== row.user_id) return { data: null, error: null };
        return { data: row, error: null };
      }),
    };
    return chain;
  };

  const buildUpdateChain = () => {
    const chain = {
      eq: vi.fn((col: string, val: string) => {
        updateEqCalls.push([col, val]);
        return chain;
      }),
      then(
        onFulfilled?: (value: { error: null }) => unknown,
        onRejected?: (reason: unknown) => unknown,
      ) {
        return Promise.resolve({ error: null }).then(onFulfilled, onRejected);
      },
    };
    return chain;
  };

  const client = {
    from: vi.fn((table: string) => {
      if (table !== 'user_powers') throw new Error(`Unexpected table: ${table}`);
      return {
        select: vi.fn(() => buildSelectChain()),
        update: vi.fn((payload: Record<string, unknown>) => {
          lastUpdate = payload;
          return buildUpdateChain();
        }),
        delete: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ error: null }),
          }),
        }),
      };
    }),
    lastUpdate: () => lastUpdate,
    updateEqCalls: () => updateEqCalls,
  };
  return client;
}

function makeGetRequest(type: string, id: string) {
  return new NextRequest(`http://localhost/api/user/library/${type}/${id}`);
}

function makePatchRequest(type: string, id: string, body: Record<string, unknown>) {
  return new NextRequest(`http://localhost/api/user/library/${type}/${id}`, {
    method: 'PATCH',
    headers: { 'content-type': 'application/json', origin: 'http://localhost' },
    body: JSON.stringify(body),
  });
}

function makeDeleteRequest(type: string, id: string, headers: Record<string, string> = {}) {
  return new NextRequest(`http://localhost/api/user/library/${type}/${id}`, {
    method: 'DELETE',
    headers: { origin: 'http://localhost', ...headers },
  });
}

async function readJson<T>(response: Response): Promise<T> {
  return response.json() as Promise<T>;
}

const params = (type: string, id: string) => ({ params: Promise.resolve({ type, id }) });

describe('GET /api/user/library/[type]/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 when session is missing', async () => {
    mockGetSession.mockResolvedValue({ user: null, error: 'No session' });

    const response = await GET(makeGetRequest('powers', 'pow-1'), params('powers', 'pow-1'));

    expect(response.status).toBe(401);
    await expect(readJson(response)).resolves.toEqual({ error: 'Unauthorized' });
  });

  it('returns 404 null for another users library item (IDOR — not 403)', async () => {
    const row = makeLibraryRow('pow-private', OWNER.uid);
    mockGetSession.mockResolvedValue({ user: OTHER, error: null });
    mockCreateClient.mockResolvedValue(createMockSupabase(row) as never);

    const response = await GET(
      makeGetRequest('powers', 'pow-private'),
      params('powers', 'pow-private'),
    );

    expect(response.status).toBe(404);
    await expect(readJson(response)).resolves.toBeNull();
  });

  it('returns the library item for the owner', async () => {
    const row = makeLibraryRow('pow-owned', OWNER.uid);
    mockGetSession.mockResolvedValue({ user: OWNER, error: null });
    mockCreateClient.mockResolvedValue(createMockSupabase(row) as never);

    const response = await GET(
      makeGetRequest('powers', 'pow-owned'),
      params('powers', 'pow-owned'),
    );

    expect(response.status).toBe(200);
    const body = await readJson<{ id: string; name: string }>(response);
    expect(body.id).toBe('pow-owned');
    expect(body.name).toBe('Firebolt');
  });
});

describe('PATCH /api/user/library/[type]/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockIsAdmin.mockResolvedValue(false);
    mockStandardLimiterCheck.mockResolvedValue({
      success: true,
      remaining: 29,
      reset: Date.now() + 60_000,
    });
  });

  it('returns 401 when session is missing', async () => {
    mockGetSession.mockResolvedValue({ user: null, error: 'No session' });

    const response = await PATCH(
      makePatchRequest('powers', 'pow-1', { name: 'Updated bolt' }),
      params('powers', 'pow-1'),
    );

    expect(response.status).toBe(401);
    await expect(readJson(response)).resolves.toEqual({ error: 'Unauthorized' });
  });

  it('returns 404 when another user tries to update a library item (IDOR)', async () => {
    const row = makeLibraryRow('pow-private', OWNER.uid);
    mockGetSession.mockResolvedValue({ user: OTHER, error: null });
    mockCreateClient.mockResolvedValue(createMockSupabase(row) as never);

    const response = await PATCH(
      makePatchRequest('powers', 'pow-private', { name: 'Stolen' }),
      params('powers', 'pow-private'),
    );

    expect(response.status).toBe(404);
    await expect(readJson(response)).resolves.toEqual({ error: 'Item not found' });
  });

  it('updates the library item for the owner', async () => {
    const row = makeLibraryRow('pow-owned', OWNER.uid);
    mockGetSession.mockResolvedValue({ user: OWNER, error: null });
    const supabase = createMockSupabase(row);
    mockCreateClient.mockResolvedValue(supabase as never);

    const response = await PATCH(
      makePatchRequest('powers', 'pow-owned', { name: 'Updated bolt' }),
      params('powers', 'pow-owned'),
    );

    expect(response.status).toBe(200);
    await expect(readJson(response)).resolves.toEqual({ ok: true });
    expect(supabase.lastUpdate()?.name).toBe('Updated bolt');
    expect(supabase.updateEqCalls()).toEqual([
      ['id', 'pow-owned'],
      ['user_id', OWNER.uid],
    ]);
  });

  it('keeps stored composition and syncMeta when only the name changes', async () => {
    const row = {
      ...makeLibraryRow('pow-owned', OWNER.uid),
      name: 'Stored power',
      payload: {
        composition: { choice: true },
        parts: [],
        syncMeta: {
          dependencyFingerprint: 'fp-test',
          syncedAt: '2026-01-01T00:00:00.000Z',
        },
      },
      action_type: 'basic',
    };
    mockGetSession.mockResolvedValue({ user: OWNER, error: null });
    const supabase = createMockSupabase(row as LibraryRow);
    mockCreateClient.mockResolvedValue(supabase as never);

    const response = await PATCH(
      makePatchRequest('powers', 'pow-owned', { name: 'Renamed power' }),
      params('powers', 'pow-owned'),
    );

    expect(response.status).toBe(200);
    const update = supabase.lastUpdate();
    expect(update?.name).toBe('Renamed power');
    expect((update?.payload as { composition?: unknown }).composition).toEqual({ choice: true });
    expect((update?.payload as { syncMeta?: { dependencyFingerprint: string } }).syncMeta).toEqual({
      dependencyFingerprint: 'fp-test',
      syncedAt: '2026-01-01T00:00:00.000Z',
    });
  });

  it('rejects unknown PATCH fields without writing', async () => {
    const row = makeLibraryRow('pow-owned', OWNER.uid);
    mockGetSession.mockResolvedValue({ user: OWNER, error: null });
    const supabase = createMockSupabase(row);
    mockCreateClient.mockResolvedValue(supabase as never);

    const response = await PATCH(
      makePatchRequest('powers', 'pow-owned', { name: 'Updated bolt', injected: true }),
      params('powers', 'pow-owned'),
    );

    expect(response.status).toBe(400);
    expect(supabase.lastUpdate()).toBeNull();
  });

  it('PAGES4-018: non-admin PATCH strips image fields before update', async () => {
    const row = makeLibraryRow('pow-owned', OWNER.uid);
    mockGetSession.mockResolvedValue({ user: OWNER, error: null });
    mockIsAdmin.mockResolvedValue(false);
    const supabase = createMockSupabase(row);
    mockCreateClient.mockResolvedValue(supabase as never);

    const response = await PATCH(
      makePatchRequest('powers', 'pow-owned', {
        imageUrl: 'https://evil.example/art.jpg',
        imageId: '11111111-1111-4111-8111-111111111111',
      }),
      params('powers', 'pow-owned'),
    );

    expect(response.status).toBe(200);
    expect(supabase.lastUpdate()?.image_id).toBeUndefined();
  });

  it('PAGES4-018: admin PATCH may persist image_id', async () => {
    const row = makeLibraryRow('pow-owned', OWNER.uid);
    mockGetSession.mockResolvedValue({ user: OWNER, error: null });
    mockIsAdmin.mockResolvedValue(true);
    const supabase = createMockSupabase(row);
    mockCreateClient.mockResolvedValue(supabase as never);
    const imageId = '33333333-3333-4333-8333-333333333333';

    const response = await PATCH(
      makePatchRequest('powers', 'pow-owned', { imageId, imageUrl: 'https://cdn.test/art.jpg' }),
      params('powers', 'pow-owned'),
    );

    expect(response.status).toBe(200);
    expect(supabase.lastUpdate()?.image_id).toBe(imageId);
  });
});

describe('DELETE /api/user/library/[type]/[id]', () => {
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

    const response = await DELETE(makeDeleteRequest('powers', 'pow-1'), params('powers', 'pow-1'));

    expect(response.status).toBe(401);
    await expect(readJson(response)).resolves.toEqual({ error: 'Unauthorized' });
  });

  it('returns 403 for a cross-origin delete', async () => {
    const row = makeLibraryRow('pow-owned', OWNER.uid);
    mockGetSession.mockResolvedValue({ user: OWNER, error: null });
    mockCreateClient.mockResolvedValue(createMockSupabase(row) as never);

    const response = await DELETE(
      makeDeleteRequest('powers', 'pow-owned', { origin: 'https://evil.example' }),
      params('powers', 'pow-owned'),
    );

    expect(response.status).toBe(403);
  });

  it('returns 404 when another user tries to delete a library item (IDOR)', async () => {
    const row = makeLibraryRow('pow-private', OWNER.uid);
    mockGetSession.mockResolvedValue({ user: OTHER, error: null });
    mockCreateClient.mockResolvedValue(createMockSupabase(row) as never);

    const response = await DELETE(
      makeDeleteRequest('powers', 'pow-private'),
      params('powers', 'pow-private'),
    );

    expect(response.status).toBe(404);
    await expect(readJson(response)).resolves.toEqual({ error: 'Item not found' });
  });

  it('deletes the library item for the owner', async () => {
    const row = makeLibraryRow('pow-owned', OWNER.uid);
    mockGetSession.mockResolvedValue({ user: OWNER, error: null });
    mockCreateClient.mockResolvedValue(createMockSupabase(row) as never);

    const response = await DELETE(
      makeDeleteRequest('powers', 'pow-owned'),
      params('powers', 'pow-owned'),
    );

    expect(response.status).toBe(200);
    await expect(readJson(response)).resolves.toEqual({ ok: true });
  });
});
