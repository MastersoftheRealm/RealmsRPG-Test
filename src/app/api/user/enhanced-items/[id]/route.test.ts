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

import { PATCH, DELETE } from './route';
import { getSession } from '@/lib/supabase/session';
import { createClient } from '@/lib/supabase/server';
import { standardLimiter } from '@/lib/rate-limit';

const mockGetSession = vi.mocked(getSession);
const mockCreateClient = vi.mocked(createClient);
const mockStandardLimiterCheck = vi.mocked(standardLimiter.check);

const OWNER = { uid: 'owner-user', email: 'owner@example.com' };
const OTHER = { uid: 'other-user', email: 'other@example.com' };

type EnhancedRow = {
  id: string;
  user_id: string;
  name: string;
  data: Record<string, unknown>;
};

function makeEnhancedRow(id: string, userId: string): EnhancedRow {
  return { id, user_id: userId, name: 'Flaming sword', data: { potency: 1 } };
}

function createMockSupabase(row: EnhancedRow | null) {
  const deleteEqCalls: [string, string][] = [];
  let lastUpdate: Record<string, unknown> | null = null;
  const updateEqCalls: Array<[string, string]> = [];
  const buildSelectChain = () => {
    const eqCalls: [string, string][] = [];
    const matchRow = () => {
      if (!row) return null;
      const filters = Object.fromEntries(eqCalls);
      if (filters.id && filters.id !== row.id) return null;
      if (filters.user_id && filters.user_id !== row.user_id) return null;
      return row;
    };
    const chain = {
      eq: vi.fn((col: string, val: string) => {
        eqCalls.push([col, val]);
        return chain;
      }),
      // maybeSingle reports a missing row as `data: null` with no error, so the
      // route can tell "not found" apart from a real query failure.
      maybeSingle: vi.fn(async () => ({ data: matchRow(), error: null })),
      single: vi.fn(async () => {
        const found = matchRow();
        if (!found) return { data: null, error: { message: 'not found', code: 'PGRST116' } };
        return { data: found, error: null };
      }),
    };
    return chain;
  };

  const deleteChain = {
    eq: vi.fn((col: string, val: string) => {
      deleteEqCalls.push([col, val]);
      return deleteChain;
    }),
    then: undefined as undefined,
  };
  Object.assign(deleteChain, {
    then: (resolve: (value: { error: null }) => unknown) =>
      Promise.resolve({ error: null }).then(resolve),
  });

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
      if (table !== 'user_enhanced_items') throw new Error(`Unexpected table: ${table}`);
      return {
        select: vi.fn(() => buildSelectChain()),
        update: vi.fn((payload: Record<string, unknown>) => {
          lastUpdate = payload;
          return buildUpdateChain();
        }),
        delete: vi.fn(() => deleteChain),
        _deleteEqCalls: deleteEqCalls,
      };
    }),
    lastUpdate: () => lastUpdate,
    updateEqCalls: () => updateEqCalls,
  };
  return client;
}

function makePatchRequest(id: string, body: Record<string, unknown>) {
  return new NextRequest(`http://localhost/api/user/enhanced-items/${id}`, {
    method: 'PATCH',
    headers: { 'content-type': 'application/json', origin: 'http://localhost' },
    body: JSON.stringify(body),
  });
}

function makeDeleteRequest(id: string, headers: Record<string, string> = {}) {
  return new NextRequest(`http://localhost/api/user/enhanced-items/${id}`, {
    method: 'DELETE',
    headers: { origin: 'http://localhost', ...headers },
  });
}

async function readJson<T>(response: Response): Promise<T> {
  return response.json() as Promise<T>;
}

describe('PATCH /api/user/enhanced-items/[id]', () => {
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

    const response = await PATCH(makePatchRequest('enh-1', { potency: 2 }), {
      params: Promise.resolve({ id: 'enh-1' }),
    });

    expect(response.status).toBe(401);
    await expect(readJson(response)).resolves.toEqual({ error: 'Unauthorized' });
  });

  it('returns 404 when another user tries to update an enhanced item (IDOR)', async () => {
    const row = makeEnhancedRow('enh-private', OWNER.uid);
    mockGetSession.mockResolvedValue({ user: OTHER, error: null });
    mockCreateClient.mockResolvedValue(createMockSupabase(row) as never);

    const response = await PATCH(makePatchRequest('enh-private', { potency: 9 }), {
      params: Promise.resolve({ id: 'enh-private' }),
    });

    expect(response.status).toBe(404);
    await expect(readJson(response)).resolves.toEqual({ error: 'Enhanced item not found' });
  });

  it('updates the enhanced item for the owner', async () => {
    const row = makeEnhancedRow('enh-owned', OWNER.uid);
    mockGetSession.mockResolvedValue({ user: OWNER, error: null });
    const supabase = createMockSupabase(row);
    mockCreateClient.mockResolvedValue(supabase as never);

    const response = await PATCH(makePatchRequest('enh-owned', { potency: 2 }), {
      params: Promise.resolve({ id: 'enh-owned' }),
    });

    expect(response.status).toBe(204);
    expect((supabase.lastUpdate()?.data as { potency?: number })?.potency).toBe(2);
    expect(supabase.updateEqCalls()).toEqual([
      ['id', 'enh-owned'],
      ['user_id', OWNER.uid],
    ]);
  });

  it('returns 403 for a cross-origin patch', async () => {
    const row = makeEnhancedRow('enh-owned', OWNER.uid);
    mockGetSession.mockResolvedValue({ user: OWNER, error: null });
    const supabase = createMockSupabase(row);
    mockCreateClient.mockResolvedValue(supabase as never);

    const response = await PATCH(
      new NextRequest('http://localhost/api/user/enhanced-items/enh-owned', {
        method: 'PATCH',
        headers: { 'content-type': 'application/json', origin: 'https://evil.example' },
        body: JSON.stringify({ potency: 2 }),
      }),
      { params: Promise.resolve({ id: 'enh-owned' }) },
    );

    expect(response.status).toBe(403);
    expect(supabase.lastUpdate()).toBeNull();
  });

  it('rejects unknown PATCH fields without writing', async () => {
    const row = makeEnhancedRow('enh-owned', OWNER.uid);
    mockGetSession.mockResolvedValue({ user: OWNER, error: null });
    const supabase = createMockSupabase(row);
    mockCreateClient.mockResolvedValue(supabase as never);

    const response = await PATCH(makePatchRequest('enh-owned', { potency: 2, injected: 1 }), {
      params: Promise.resolve({ id: 'enh-owned' }),
    });

    expect(response.status).toBe(400);
    expect(supabase.lastUpdate()).toBeNull();
  });
});

describe('DELETE /api/user/enhanced-items/[id]', () => {
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

    const response = await DELETE(makeDeleteRequest('enh-1'), {
      params: Promise.resolve({ id: 'enh-1' }),
    });

    expect(response.status).toBe(401);
    await expect(readJson(response)).resolves.toEqual({ error: 'Unauthorized' });
  });

  it('returns 403 for a cross-origin delete', async () => {
    const row = makeEnhancedRow('enh-owned', OWNER.uid);
    mockGetSession.mockResolvedValue({ user: OWNER, error: null });
    mockCreateClient.mockResolvedValue(createMockSupabase(row) as never);

    const response = await DELETE(
      makeDeleteRequest('enh-owned', { origin: 'https://evil.example' }),
      { params: Promise.resolve({ id: 'enh-owned' }) },
    );

    expect(response.status).toBe(403);
  });

  it('scopes delete to the session user_id (IDOR — does not look up by id alone)', async () => {
    const row = makeEnhancedRow('enh-private', OWNER.uid);
    mockGetSession.mockResolvedValue({ user: OTHER, error: null });
    const supabase = createMockSupabase(row);
    mockCreateClient.mockResolvedValue(supabase as never);

    const response = await DELETE(makeDeleteRequest('enh-private'), {
      params: Promise.resolve({ id: 'enh-private' }),
    });

    expect(response.status).toBe(204);
    const fromResult = supabase.from('user_enhanced_items') as {
      _deleteEqCalls: [string, string][];
    };
    expect(fromResult._deleteEqCalls).toContainEqual(['user_id', OTHER.uid]);
    expect(fromResult._deleteEqCalls).toContainEqual(['id', 'enh-private']);
  });

  it('deletes the enhanced item for the owner', async () => {
    const row = makeEnhancedRow('enh-owned', OWNER.uid);
    mockGetSession.mockResolvedValue({ user: OWNER, error: null });
    mockCreateClient.mockResolvedValue(createMockSupabase(row) as never);

    const response = await DELETE(makeDeleteRequest('enh-owned'), {
      params: Promise.resolve({ id: 'enh-owned' }),
    });

    expect(response.status).toBe(204);
  });
});
