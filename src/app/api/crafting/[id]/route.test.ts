import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/lib/supabase/session', () => ({
  getSession: vi.fn(),
}));

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}));

vi.mock('@/lib/rate-limit', () => ({
  standardLimiter: {
    check: vi.fn(() => Promise.resolve({ success: true, remaining: 29, reset: Date.now() + 60_000 })),
  },
}));

vi.mock('@/lib/api-validation', () => ({
  validateJson: vi.fn(),
  craftingSessionUpdateSchema: {},
}));

import { GET, PATCH, DELETE } from './route';
import { getSession } from '@/lib/supabase/session';
import { createClient } from '@/lib/supabase/server';
import { validateJson } from '@/lib/api-validation';
import { standardLimiter } from '@/lib/rate-limit';

const mockGetSession = vi.mocked(getSession);
const mockCreateClient = vi.mocked(createClient);
const mockValidateJson = vi.mocked(validateJson);
const mockStandardLimiterCheck = vi.mocked(standardLimiter.check);

const OWNER = { uid: 'owner-user', email: 'owner@example.com' };
const OTHER = { uid: 'other-user', email: 'other@example.com' };

type CraftingRow = {
  id: string;
  user_id: string;
  data: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

function makeCraftingRow(id: string, userId: string): CraftingRow {
  return {
    id,
    user_id: userId,
    data: { status: 'planned', item: { name: 'Sword' } },
    created_at: '2026-07-01T12:00:00.000Z',
    updated_at: '2026-07-01T12:00:00.000Z',
  };
}

function createMockSupabase(row: CraftingRow | null) {
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

  return {
    from: vi.fn((table: string) => {
      if (table !== 'crafting_sessions') throw new Error(`Unexpected table: ${table}`);
      return {
        select: vi.fn(() => buildSelectChain()),
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ error: null }),
          }),
        }),
        delete: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ error: null }),
          }),
        }),
      };
    }),
  };
}

function makeGetRequest(id: string) {
  return new NextRequest(`http://localhost/api/crafting/${id}`);
}

function makePatchRequest(id: string, body: Record<string, unknown>) {
  return new NextRequest(`http://localhost/api/crafting/${id}`, {
    method: 'PATCH',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
}

function makeDeleteRequest(id: string) {
  return new NextRequest(`http://localhost/api/crafting/${id}`, { method: 'DELETE' });
}

async function readJson<T>(response: Response): Promise<T> {
  return response.json() as Promise<T>;
}

describe('GET /api/crafting/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 when session is missing', async () => {
    mockGetSession.mockResolvedValue({ user: null, error: 'No session' });

    const response = await GET(makeGetRequest('craft-1'), {
      params: Promise.resolve({ id: 'craft-1' }),
    });

    expect(response.status).toBe(401);
    await expect(readJson(response)).resolves.toEqual({ error: 'Unauthorized' });
  });

  it('returns 404 for another users crafting session (IDOR — not 403)', async () => {
    const row = makeCraftingRow('craft-private', OWNER.uid);
    mockGetSession.mockResolvedValue({ user: OTHER, error: null });
    mockCreateClient.mockResolvedValue(createMockSupabase(row) as never);

    const response = await GET(makeGetRequest('craft-private'), {
      params: Promise.resolve({ id: 'craft-private' }),
    });

    expect(response.status).toBe(404);
    await expect(readJson(response)).resolves.toEqual({ error: 'Crafting session not found' });
  });

  it('returns the crafting session for the owner', async () => {
    const row = makeCraftingRow('craft-owned', OWNER.uid);
    mockGetSession.mockResolvedValue({ user: OWNER, error: null });
    mockCreateClient.mockResolvedValue(createMockSupabase(row) as never);

    const response = await GET(makeGetRequest('craft-owned'), {
      params: Promise.resolve({ id: 'craft-owned' }),
    });

    expect(response.status).toBe(200);
    const body = await readJson<{ id: string }>(response);
    expect(body.id).toBe('craft-owned');
  });
});

describe('PATCH /api/crafting/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockStandardLimiterCheck.mockResolvedValue({
      success: true,
      remaining: 29,
      reset: Date.now() + 60_000,
    });
    mockValidateJson.mockResolvedValue({
      success: true,
      data: { status: 'in-progress' },
    } as never);
  });

  it('returns 401 when session is missing', async () => {
    mockGetSession.mockResolvedValue({ user: null, error: 'No session' });

    const response = await PATCH(makePatchRequest('craft-1', { status: 'in-progress' }), {
      params: Promise.resolve({ id: 'craft-1' }),
    });

    expect(response.status).toBe(401);
    await expect(readJson(response)).resolves.toEqual({ error: 'Unauthorized' });
  });

  it('returns 404 when another user tries to update a crafting session (IDOR)', async () => {
    const row = makeCraftingRow('craft-private', OWNER.uid);
    mockGetSession.mockResolvedValue({ user: OTHER, error: null });
    mockCreateClient.mockResolvedValue(createMockSupabase(row) as never);

    const response = await PATCH(makePatchRequest('craft-private', { status: 'in-progress' }), {
      params: Promise.resolve({ id: 'craft-private' }),
    });

    expect(response.status).toBe(404);
    await expect(readJson(response)).resolves.toEqual({ error: 'Crafting session not found' });
  });

  it('updates the crafting session for the owner', async () => {
    const row = makeCraftingRow('craft-owned', OWNER.uid);
    mockGetSession.mockResolvedValue({ user: OWNER, error: null });
    mockCreateClient.mockResolvedValue(createMockSupabase(row) as never);

    const response = await PATCH(makePatchRequest('craft-owned', { status: 'in-progress' }), {
      params: Promise.resolve({ id: 'craft-owned' }),
    });

    expect(response.status).toBe(204);
  });
});

describe('DELETE /api/crafting/[id]', () => {
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

    const response = await DELETE(makeDeleteRequest('craft-1'), {
      params: Promise.resolve({ id: 'craft-1' }),
    });

    expect(response.status).toBe(401);
    await expect(readJson(response)).resolves.toEqual({ error: 'Unauthorized' });
  });

  it('returns 404 when another user tries to delete a crafting session (IDOR)', async () => {
    const row = makeCraftingRow('craft-private', OWNER.uid);
    mockGetSession.mockResolvedValue({ user: OTHER, error: null });
    mockCreateClient.mockResolvedValue(createMockSupabase(row) as never);

    const response = await DELETE(makeDeleteRequest('craft-private'), {
      params: Promise.resolve({ id: 'craft-private' }),
    });

    expect(response.status).toBe(404);
    await expect(readJson(response)).resolves.toEqual({ error: 'Crafting session not found' });
  });

  it('deletes the crafting session for the owner', async () => {
    const row = makeCraftingRow('craft-owned', OWNER.uid);
    mockGetSession.mockResolvedValue({ user: OWNER, error: null });
    mockCreateClient.mockResolvedValue(createMockSupabase(row) as never);

    const response = await DELETE(makeDeleteRequest('craft-owned'), {
      params: Promise.resolve({ id: 'craft-owned' }),
    });

    expect(response.status).toBe(204);
  });
});
