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

// verifyMutationRequest stays real so the same-origin guard is exercised.
vi.mock('@/lib/api-validation', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/api-validation')>();
  return {
    ...actual,
    validateJson: vi.fn(),
    encounterUpdateSchema: {},
  };
});

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

type EncounterRow = {
  id: string;
  user_id: string;
  data: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

function makeEncounterRow(id: string, userId: string): EncounterRow {
  return {
    id,
    user_id: userId,
    data: { name: 'Boss fight', type: 'combat', status: 'preparing' },
    created_at: '2026-07-01T12:00:00.000Z',
    updated_at: '2026-07-01T12:00:00.000Z',
  };
}

function createMockSupabase(row: EncounterRow | null) {
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
      if (table !== 'encounters') throw new Error(`Unexpected table: ${table}`);
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
  return new NextRequest(`http://localhost/api/encounters/${id}`);
}

function makePatchRequest(id: string, body: Record<string, unknown>) {
  return new NextRequest(`http://localhost/api/encounters/${id}`, {
    method: 'PATCH',
    headers: { 'content-type': 'application/json', origin: 'http://localhost' },
    body: JSON.stringify(body),
  });
}

function makeDeleteRequest(id: string, headers: Record<string, string> = {}) {
  return new NextRequest(`http://localhost/api/encounters/${id}`, {
    method: 'DELETE',
    headers: { origin: 'http://localhost', ...headers },
  });
}

async function readJson<T>(response: Response): Promise<T> {
  return response.json() as Promise<T>;
}

describe('GET /api/encounters/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 when session is missing', async () => {
    mockGetSession.mockResolvedValue({ user: null, error: 'No session' });

    const response = await GET(makeGetRequest('enc-1'), {
      params: Promise.resolve({ id: 'enc-1' }),
    });

    expect(response.status).toBe(401);
    await expect(readJson(response)).resolves.toEqual({ error: 'Unauthorized' });
  });

  it('returns 404 for another users encounter (IDOR — not 403)', async () => {
    const row = makeEncounterRow('enc-private', OWNER.uid);
    mockGetSession.mockResolvedValue({ user: OTHER, error: null });
    mockCreateClient.mockResolvedValue(createMockSupabase(row) as never);

    const response = await GET(makeGetRequest('enc-private'), {
      params: Promise.resolve({ id: 'enc-private' }),
    });

    expect(response.status).toBe(404);
    await expect(readJson(response)).resolves.toEqual({ error: 'Encounter not found' });
  });

  it('returns the encounter for the owner', async () => {
    const row = makeEncounterRow('enc-owned', OWNER.uid);
    mockGetSession.mockResolvedValue({ user: OWNER, error: null });
    mockCreateClient.mockResolvedValue(createMockSupabase(row) as never);

    const response = await GET(makeGetRequest('enc-owned'), {
      params: Promise.resolve({ id: 'enc-owned' }),
    });

    expect(response.status).toBe(200);
    const body = await readJson<{ id: string; name: string }>(response);
    expect(body.id).toBe('enc-owned');
    expect(body.name).toBe('Boss fight');
  });
});

describe('PATCH /api/encounters/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockStandardLimiterCheck.mockResolvedValue({
      success: true,
      remaining: 29,
      reset: Date.now() + 60_000,
    });
    mockValidateJson.mockResolvedValue({
      success: true,
      data: { name: 'Updated fight' },
    } as never);
  });

  it('returns 401 when session is missing', async () => {
    mockGetSession.mockResolvedValue({ user: null, error: 'No session' });

    const response = await PATCH(makePatchRequest('enc-1', { name: 'Updated fight' }), {
      params: Promise.resolve({ id: 'enc-1' }),
    });

    expect(response.status).toBe(401);
    await expect(readJson(response)).resolves.toEqual({ error: 'Unauthorized' });
  });

  it('returns 404 when another user tries to update an encounter (IDOR)', async () => {
    const row = makeEncounterRow('enc-private', OWNER.uid);
    mockGetSession.mockResolvedValue({ user: OTHER, error: null });
    mockCreateClient.mockResolvedValue(createMockSupabase(row) as never);

    const response = await PATCH(makePatchRequest('enc-private', { name: 'Stolen' }), {
      params: Promise.resolve({ id: 'enc-private' }),
    });

    expect(response.status).toBe(404);
    await expect(readJson(response)).resolves.toEqual({ error: 'Encounter not found' });
  });

  it('updates the encounter for the owner', async () => {
    const row = makeEncounterRow('enc-owned', OWNER.uid);
    mockGetSession.mockResolvedValue({ user: OWNER, error: null });
    mockCreateClient.mockResolvedValue(createMockSupabase(row) as never);

    const response = await PATCH(makePatchRequest('enc-owned', { name: 'Updated fight' }), {
      params: Promise.resolve({ id: 'enc-owned' }),
    });

    expect(response.status).toBe(204);
  });
});

describe('DELETE /api/encounters/[id]', () => {
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

    const response = await DELETE(makeDeleteRequest('enc-1'), {
      params: Promise.resolve({ id: 'enc-1' }),
    });

    expect(response.status).toBe(401);
    await expect(readJson(response)).resolves.toEqual({ error: 'Unauthorized' });
  });

  it('returns 404 when another user tries to delete an encounter (IDOR)', async () => {
    const row = makeEncounterRow('enc-private', OWNER.uid);
    mockGetSession.mockResolvedValue({ user: OTHER, error: null });
    mockCreateClient.mockResolvedValue(createMockSupabase(row) as never);

    const response = await DELETE(makeDeleteRequest('enc-private'), {
      params: Promise.resolve({ id: 'enc-private' }),
    });

    expect(response.status).toBe(404);
    await expect(readJson(response)).resolves.toEqual({ error: 'Encounter not found' });
  });

  it('deletes the encounter for the owner', async () => {
    const row = makeEncounterRow('enc-owned', OWNER.uid);
    mockGetSession.mockResolvedValue({ user: OWNER, error: null });
    mockCreateClient.mockResolvedValue(createMockSupabase(row) as never);

    const response = await DELETE(makeDeleteRequest('enc-owned'), {
      params: Promise.resolve({ id: 'enc-owned' }),
    });

    expect(response.status).toBe(204);
  });
});
