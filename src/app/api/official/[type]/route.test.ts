import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/lib/supabase/session', () => ({
  getSession: vi.fn(),
  requireLiveUser: vi.fn(),
}));

vi.mock('@/lib/admin', () => ({
  isAdmin: vi.fn(),
}));

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
  createServiceRoleClient: vi.fn(),
}));

vi.mock('@/lib/supabase/public-client', () => ({
  createPublicClient: vi.fn(() => null),
}));

vi.mock('@/lib/entity-image-enrich-server', () => ({
  enrichRowsWithBankImageUrls: vi.fn(() => Promise.resolve()),
}));

import {
  PRIVATE_MUST_REVALIDATE_CACHE_CONTROL,
  PRIVATE_NO_STORE_CACHE_CONTROL,
  PUBLIC_CDN_CACHE_CONTROL,
} from '@/lib/api/public-cdn-cache';
import { GET, POST, PATCH, DELETE } from './route';
import { getSession, requireLiveUser } from '@/lib/supabase/session';
import { isAdmin } from '@/lib/admin';
import { createPublicClient } from '@/lib/supabase/public-client';
import { createClient, createServiceRoleClient } from '@/lib/supabase/server';

const mockGetSession = vi.mocked(getSession);
const mockRequireLiveUser = vi.mocked(requireLiveUser);
const mockIsAdmin = vi.mocked(isAdmin);
const mockCreateClient = vi.mocked(createClient);
const mockCreatePublicClient = vi.mocked(createPublicClient);
const mockCreateServiceRoleClient = vi.mocked(createServiceRoleClient);

const USER = { uid: 'user-123', email: 'hero@example.com' };

function createListSupabase() {
  const query = {
    eq: vi.fn(function eq() {
      return query;
    }),
    then(
      onFulfilled?: (value: { data: unknown[]; error: null }) => unknown,
      onRejected?: (reason: unknown) => unknown,
    ) {
      return Promise.resolve({ data: [], error: null }).then(onFulfilled, onRejected);
    },
  };
  return {
    from: vi.fn(() => ({
      select: vi.fn(() => query),
    })),
    query,
  };
}

function makeGetRequest(type: string, search = '') {
  return new NextRequest(`http://localhost/api/official/${type}${search}`);
}

function makePostRequest(type: string) {
  return new NextRequest(`http://localhost/api/official/${type}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', origin: 'http://localhost' },
    body: JSON.stringify({ name: 'Firebolt' }),
  });
}

function makeDeleteRequest(type: string, id = 'item-1') {
  return new NextRequest(`http://localhost/api/official/${type}?id=${id}`, {
    method: 'DELETE',
    headers: { origin: 'http://localhost' },
  });
}

async function readJson<T>(response: Response): Promise<T> {
  return response.json() as Promise<T>;
}

const params = (type: string) => ({ params: Promise.resolve({ type }) });

describe('GET /api/official/[type]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCreatePublicClient.mockReturnValue(null);
  });

  it('returns official items without a session (public read)', async () => {
    const supabase = createListSupabase();
    mockCreatePublicClient.mockReturnValue(supabase as never);

    const response = await GET(makeGetRequest('powers'), params('powers'));

    expect(response.status).toBe(200);
    await expect(readJson(response)).resolves.toEqual([]);
    expect(mockGetSession).not.toHaveBeenCalled();
    expect(mockCreateClient).not.toHaveBeenCalled();
    expect(response.headers.get('Cache-Control')).toBe(PRIVATE_MUST_REVALIDATE_CACHE_CONTROL);
  });

  it('sets public CDN cache headers when listed powers exist', async () => {
    const query = {
      eq: vi.fn(function eq() {
        return query;
      }),
      then(
        onFulfilled?: (value: { data: unknown[]; error: null }) => unknown,
        onRejected?: (reason: unknown) => unknown,
      ) {
        return Promise.resolve({
          data: [
            {
              id: 'p1',
              name: 'Bolt',
              catalog_listing: 'listed',
              payload: {},
              created_at: '2026-01-01T00:00:00Z',
              updated_at: '2026-01-01T00:00:00Z',
            },
          ],
          error: null,
        }).then(onFulfilled, onRejected);
      },
    };
    const supabase = {
      from: vi.fn(() => ({
        select: vi.fn(() => query),
      })),
    };
    mockCreatePublicClient.mockReturnValue(supabase as never);

    const response = await GET(makeGetRequest('powers'), params('powers'));
    expect(response.status).toBe(200);
    expect(response.headers.get('Cache-Control')).toBe(PUBLIC_CDN_CACHE_CONTROL);
    expect(mockCreateClient).not.toHaveBeenCalled();
  });

  it('does not CDN-cache listed powers when the cookie-less client is unavailable', async () => {
    mockCreatePublicClient.mockReturnValue(null);
    const query = {
      eq: vi.fn(function eq() {
        return query;
      }),
      then(
        onFulfilled?: (value: { data: unknown[]; error: null }) => unknown,
        onRejected?: (reason: unknown) => unknown,
      ) {
        return Promise.resolve({
          data: [{ id: 'p1', name: 'Bolt', catalog_listing: 'listed', payload: {} }],
          error: null,
        }).then(onFulfilled, onRejected);
      },
    };
    mockCreateClient.mockResolvedValue({
      from: vi.fn(() => ({
        select: vi.fn(() => query),
      })),
    } as never);

    const response = await GET(makeGetRequest('powers'), params('powers'));
    expect(response.status).toBe(200);
    expect(response.headers.get('Cache-Control')).toBe(PRIVATE_NO_STORE_CACHE_CONTROL);
  });

  it('does not CDN-cache a list that still contains an unlisted item', async () => {
    const query = {
      eq: vi.fn(function eq() {
        return query;
      }),
      then(
        onFulfilled?: (value: { data: unknown[]; error: null }) => unknown,
        onRejected?: (reason: unknown) => unknown,
      ) {
        return Promise.resolve({
          data: [{ id: 'hidden', name: 'Hidden', catalog_listing: 'unlisted', payload: {} }],
          error: null,
        }).then(onFulfilled, onRejected);
      },
    };
    mockCreatePublicClient.mockReturnValue({
      from: vi.fn(() => ({
        select: vi.fn(() => query),
      })),
    } as never);

    const response = await GET(makeGetRequest('powers'), params('powers'));
    expect(response.status).toBe(200);
    expect(response.headers.get('Cache-Control')).toBe(PRIVATE_MUST_REVALIDATE_CACHE_CONTROL);
  });

  it('filters catalog_listing listed by default', async () => {
    const supabase = createListSupabase();
    mockCreateClient.mockResolvedValue(supabase as never);

    await GET(makeGetRequest('powers'), params('powers'));

    expect(supabase.query.eq).toHaveBeenCalledWith('catalog_listing', 'listed');
  });

  it('keeps the listed filter when includeUnlisted=1 without an admin session', async () => {
    const supabase = createListSupabase();
    mockCreateClient.mockResolvedValue(supabase as never);
    mockGetSession.mockResolvedValue({ user: null, error: 'No session' });

    await GET(makeGetRequest('powers', '?includeUnlisted=1'), params('powers'));

    expect(mockGetSession).toHaveBeenCalled();
    expect(supabase.query.eq).toHaveBeenCalledWith('catalog_listing', 'listed');
  });

  it('omits the listed filter for an admin with includeUnlisted=1', async () => {
    const supabase = createListSupabase();
    mockCreateClient.mockResolvedValue(supabase as never);
    mockGetSession.mockResolvedValue({ user: USER, error: null });
    mockIsAdmin.mockResolvedValue(true);

    await GET(makeGetRequest('powers', '?includeUnlisted=1'), params('powers'));

    expect(mockIsAdmin).toHaveBeenCalledWith(USER.uid);
    expect(supabase.query.eq).not.toHaveBeenCalled();
  });
});

describe('POST /api/official/[type]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 when session is missing', async () => {
    mockRequireLiveUser.mockRejectedValue(new Error('Authentication required'));

    const response = await POST(makePostRequest('powers'), params('powers'));

    expect(response.status).toBe(401);
    await expect(readJson(response)).resolves.toEqual({ error: 'Unauthorized' });
    expect(mockCreateServiceRoleClient).not.toHaveBeenCalled();
  });

  it('returns 403 when the user is authenticated but not admin', async () => {
    mockRequireLiveUser.mockResolvedValue(USER);
    mockIsAdmin.mockResolvedValue(false);

    const response = await POST(makePostRequest('powers'), params('powers'));

    expect(response.status).toBe(403);
    await expect(readJson(response)).resolves.toEqual({ error: 'Admin only' });
    expect(mockCreateServiceRoleClient).not.toHaveBeenCalled();
  });

  function mockOfficialPostSupabase(options: {
    currentRow: { name: string } | null;
    nameCollision: { id: string } | null;
    updateRows: { id: string }[];
  }) {
    const insertSingle = vi.fn(async () => ({ data: { id: 'new' }, error: null }));
    let selectCall = 0;
    const selectChain = {
      eq: vi.fn(function eq() {
        return selectChain;
      }),
      neq: vi.fn(function neq() {
        return selectChain;
      }),
      ilike: vi.fn(function ilike() {
        return selectChain;
      }),
      limit: vi.fn(function limit() {
        return selectChain;
      }),
      maybeSingle: vi.fn(async () => {
        selectCall += 1;
        if (selectCall === 1) {
          return { data: options.currentRow, error: null };
        }
        return { data: options.nameCollision, error: null };
      }),
    };
    const updateChain = {
      eq: vi.fn(function eq() {
        return updateChain;
      }),
      select: vi.fn(function select() {
        return updateChain;
      }),
      then(
        onFulfilled?: (value: { data: unknown[]; error: null }) => unknown,
        onRejected?: (reason: unknown) => unknown,
      ) {
        return Promise.resolve({ data: options.updateRows, error: null }).then(
          onFulfilled,
          onRejected,
        );
      },
    };
    const update = vi.fn(() => updateChain);
    const supabase = {
      from: vi.fn(() => ({
        select: vi.fn(() => selectChain),
        update,
        insert: vi.fn(() => ({
          select: vi.fn(() => ({ single: insertSingle })),
        })),
      })),
    };
    return { supabase, update, insertSingle, selectChain };
  }

  it('returns 404 when update id does not match any row (no silent insert)', async () => {
    mockRequireLiveUser.mockResolvedValue(USER);
    mockIsAdmin.mockResolvedValue(true);

    const missingId = '11111111-1111-1111-1111-111111111111';
    const { supabase, insertSingle } = mockOfficialPostSupabase({
      currentRow: null,
      nameCollision: null,
      updateRows: [],
    });
    mockCreateServiceRoleClient.mockReturnValue(supabase as never);

    const request = new NextRequest('http://localhost/api/official/powers', {
      method: 'POST',
      headers: { 'content-type': 'application/json', origin: 'http://localhost' },
      body: JSON.stringify({ id: missingId, name: 'Renamed Bolt', description: 'x' }),
    });

    const response = await POST(request, params('powers'));

    expect(response.status).toBe(404);
    await expect(readJson(response)).resolves.toEqual({ error: 'Official item not found' });
    expect(insertSingle).not.toHaveBeenCalled();
  });

  it('returns 409 when rename would collide with another official row name (case-insensitive)', async () => {
    mockRequireLiveUser.mockResolvedValue(USER);
    mockIsAdmin.mockResolvedValue(true);

    const existingId = '22222222-2222-2222-2222-222222222222';
    const { supabase, update, selectChain } = mockOfficialPostSupabase({
      currentRow: { name: 'Original Bolt' },
      nameCollision: { id: 'other-row' },
      updateRows: [{ id: existingId }],
    });
    mockCreateServiceRoleClient.mockReturnValue(supabase as never);

    const request = new NextRequest('http://localhost/api/official/powers', {
      method: 'POST',
      headers: { 'content-type': 'application/json', origin: 'http://localhost' },
      body: JSON.stringify({ id: existingId, name: 'taken name', description: 'x' }),
    });

    const response = await POST(request, params('powers'));

    expect(response.status).toBe(409);
    await expect(readJson(response)).resolves.toEqual({
      error: 'Another official item already uses this name',
    });
    expect(selectChain.ilike).toHaveBeenCalledWith('name', 'taken name');
    expect(update).not.toHaveBeenCalled();
  });

  it('allows update when the name is unchanged even if another row shares that name', async () => {
    mockRequireLiveUser.mockResolvedValue(USER);
    mockIsAdmin.mockResolvedValue(true);

    const existingId = '33333333-3333-3333-3333-333333333333';
    const { supabase, update, selectChain } = mockOfficialPostSupabase({
      currentRow: { name: 'Vampiric' },
      nameCollision: { id: 'duplicate-row' },
      updateRows: [{ id: existingId }],
    });
    mockCreateServiceRoleClient.mockReturnValue(supabase as never);

    const request = new NextRequest('http://localhost/api/official/powers', {
      method: 'POST',
      headers: { 'content-type': 'application/json', origin: 'http://localhost' },
      body: JSON.stringify({ id: existingId, name: 'Vampiric', description: 'updated text' }),
    });

    const response = await POST(request, params('powers'));

    expect(response.status).toBe(200);
    await expect(readJson(response)).resolves.toEqual({ id: existingId });
    expect(selectChain.ilike).not.toHaveBeenCalled();
    expect(update).toHaveBeenCalled();
  });
});

describe('PATCH /api/official/[type]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  function makePatchRequest(type: string) {
    return new NextRequest(`http://localhost/api/official/${type}`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json', origin: 'http://localhost' },
      body: JSON.stringify({
        id: '11111111-1111-1111-1111-111111111111',
        catalogListing: 'unlisted',
      }),
    });
  }

  it('returns 401 when session is missing', async () => {
    mockRequireLiveUser.mockRejectedValue(new Error('Authentication required'));

    const response = await PATCH(makePatchRequest('powers'), params('powers'));

    expect(response.status).toBe(401);
    await expect(readJson(response)).resolves.toEqual({ error: 'Unauthorized' });
    expect(mockCreateServiceRoleClient).not.toHaveBeenCalled();
  });

  it('returns 403 when the user is authenticated but not admin', async () => {
    mockRequireLiveUser.mockResolvedValue(USER);
    mockIsAdmin.mockResolvedValue(false);

    const response = await PATCH(makePatchRequest('powers'), params('powers'));

    expect(response.status).toBe(403);
    await expect(readJson(response)).resolves.toEqual({ error: 'Admin only' });
    expect(mockCreateServiceRoleClient).not.toHaveBeenCalled();
  });
});

describe('DELETE /api/official/[type]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 when session is missing', async () => {
    mockRequireLiveUser.mockRejectedValue(new Error('Authentication required'));

    const response = await DELETE(makeDeleteRequest('powers'), params('powers'));

    expect(response.status).toBe(401);
    await expect(readJson(response)).resolves.toEqual({ error: 'Unauthorized' });
    expect(mockCreateServiceRoleClient).not.toHaveBeenCalled();
  });

  it('returns 403 when the user is authenticated but not admin', async () => {
    mockRequireLiveUser.mockResolvedValue(USER);
    mockIsAdmin.mockResolvedValue(false);

    const response = await DELETE(makeDeleteRequest('powers'), params('powers'));

    expect(response.status).toBe(403);
    await expect(readJson(response)).resolves.toEqual({ error: 'Admin only' });
    expect(mockCreateServiceRoleClient).not.toHaveBeenCalled();
  });
});
