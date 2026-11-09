import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/lib/supabase/session', () => ({
  getSession: vi.fn(),
}));

vi.mock('@/lib/admin', () => ({
  isAdmin: vi.fn(),
  requireLiveAdminSession: vi.fn(),
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

vi.mock('@/lib/codex/id-allocation', () => ({
  allocateCodexNumericId: vi.fn(),
  retireCodexId: vi.fn(() => Promise.resolve()),
}));

vi.mock('@/lib/codex-changelog', () => ({
  recordCodexChange: vi.fn(async () => undefined),
}));

import {
  PRIVATE_MUST_REVALIDATE_CACHE_CONTROL,
  PRIVATE_NO_STORE_CACHE_CONTROL,
  PUBLIC_CDN_CACHE_CONTROL,
} from '@/lib/api/public-cdn-cache';
import { GET, POST, PATCH, DELETE } from './route';
import { getSession } from '@/lib/supabase/session';
import { isAdmin, requireLiveAdminSession } from '@/lib/admin';
import { createPublicClient } from '@/lib/supabase/public-client';
import { createClient, createServiceRoleClient } from '@/lib/supabase/server';
import { recordCodexChange } from '@/lib/codex-changelog';
import * as nextCache from 'next/cache';

const mockGetSession = vi.mocked(getSession);
const mockIsAdmin = vi.mocked(isAdmin);
const mockRequireLiveAdminSession = vi.mocked(requireLiveAdminSession);
const mockCreateClient = vi.mocked(createClient);
const mockCreatePublicClient = vi.mocked(createPublicClient);
const mockCreateServiceRoleClient = vi.mocked(createServiceRoleClient);

const USER = { uid: 'user-123', email: 'hero@example.com' };

function assertLogArgumentsExcludeCanary(
  errorSpy: ReturnType<typeof vi.spyOn>,
  canary: string,
): void {
  for (const call of errorSpy.mock.calls) {
    for (const arg of call) {
      if (typeof arg === 'string') {
        expect(arg).not.toContain(canary);
        continue;
      }
      expect(JSON.stringify(arg)).not.toContain(canary);
    }
  }
}

function mockOfficialPowerCreateSupabase() {
  const insertSingle = vi.fn(async () => ({
    data: { id: 'power-changelog-fail', name: 'Firebolt', payload: {} },
    error: null,
  }));
  const insert = vi.fn(() => ({
    select: vi.fn(() => ({ single: insertSingle })),
  }));
  mockCreateServiceRoleClient.mockReturnValue({
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        ilike: vi.fn().mockReturnThis(),
        neq: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn(async () => ({ data: null, error: null })),
      })),
      insert,
    })),
  } as never);
  return { insertSingle };
}

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

  it('accepts empowered-techniques as an official library type (not 400 Invalid type)', async () => {
    const supabase = createListSupabase();
    mockCreatePublicClient.mockReturnValue(supabase as never);

    const response = await GET(
      makeGetRequest('empowered-techniques'),
      params('empowered-techniques'),
    );

    expect(response.status).toBe(200);
  });

  it('rejects unknown query keys with 400', async () => {
    const response = await GET(
      makeGetRequest('powers', '?includeUnlisted=1&extra=1'),
      params('powers'),
    );

    expect(response.status).toBe(400);
  });

  it('allows includeUnlisted=1 for admin session reads', async () => {
    const supabase = createListSupabase();
    mockCreateClient.mockResolvedValue(supabase as never);
    mockGetSession.mockResolvedValue({ user: USER, error: null });
    mockIsAdmin.mockResolvedValue(true);

    const response = await GET(makeGetRequest('powers', '?includeUnlisted=1'), params('powers'));

    expect(response.status).toBe(200);
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
    mockRequireLiveAdminSession.mockResolvedValue({
      ok: false,
      status: 401,
      body: { error: 'Unauthorized' },
    });

    const response = await POST(makePostRequest('powers'), params('powers'));

    expect(response.status).toBe(401);
    await expect(readJson(response)).resolves.toEqual({ error: 'Unauthorized' });
    expect(mockCreateServiceRoleClient).not.toHaveBeenCalled();
  });

  it('returns 403 when the user is authenticated but not admin', async () => {
    mockRequireLiveAdminSession.mockResolvedValue({
      ok: false,
      status: 403,
      body: { error: 'Forbidden' },
    });

    const response = await POST(makePostRequest('powers'), params('powers'));

    expect(response.status).toBe(403);
    await expect(readJson(response)).resolves.toEqual({ error: 'Forbidden' });
    expect(mockCreateServiceRoleClient).not.toHaveBeenCalled();
  });

  it('returns 403 before validation when a non-admin posts official image fields', async () => {
    mockRequireLiveAdminSession.mockResolvedValue({
      ok: false,
      status: 403,
      body: { error: 'Forbidden' },
    });

    const request = new NextRequest('http://localhost/api/official/powers', {
      method: 'POST',
      headers: { 'content-type': 'application/json', origin: 'http://localhost' },
      body: JSON.stringify({
        name: 'Firebolt',
        imageId: '11111111-1111-4111-8111-111111111111',
        imageUrl: 'https://evil.example/art.jpg',
      }),
    });

    const response = await POST(request, params('powers'));

    expect(response.status).toBe(403);
    await expect(readJson(response)).resolves.toEqual({ error: 'Forbidden' });
    expect(mockCreateServiceRoleClient).not.toHaveBeenCalled();
  });

  it('records create changelog with afterData and null beforeData', async () => {
    mockRequireLiveAdminSession.mockResolvedValue({ ok: true, userId: USER.uid });
    const insertSingle = vi.fn(async () => ({
      data: {
        id: 'power-new-id',
        name: 'Firebolt',
        payload: {},
        catalog_listing: 'listed',
      },
      error: null,
    }));
    const insert = vi.fn(() => ({
      select: vi.fn(() => ({ single: insertSingle })),
    }));
    mockCreateServiceRoleClient.mockReturnValue({
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          ilike: vi.fn().mockReturnThis(),
          neq: vi.fn().mockReturnThis(),
          limit: vi.fn().mockReturnThis(),
          maybeSingle: vi.fn(async () => ({ data: null, error: null })),
        })),
        insert,
      })),
    } as never);

    const response = await POST(makePostRequest('powers'), params('powers'));

    expect(response.status).toBe(200);
    expect(insert).toHaveBeenCalled();
    expect(recordCodexChange).toHaveBeenCalledWith(
      expect.objectContaining({
        entityType: 'official_powers',
        operation: 'create',
        changedByUserId: USER.uid,
        beforeData: null,
        afterData: expect.objectContaining({ name: 'Firebolt' }),
      }),
    );
  });

  it('returns success when changelog rejects with an Error (no raw message in logs)', async () => {
    mockRequireLiveAdminSession.mockResolvedValue({ ok: true, userId: USER.uid });
    const canary = 'PRIVATE_CANARY_ERROR_7f3a';
    vi.mocked(recordCodexChange).mockRejectedValueOnce(new Error(`changelog failure ${canary}`));
    const { insertSingle } = mockOfficialPowerCreateSupabase();
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const revalidateSpy = vi.spyOn(nextCache, 'revalidateTag').mockImplementation(() => {});

    const response = await POST(makePostRequest('powers'), params('powers'));

    expect(response.status).toBe(200);
    await expect(readJson(response)).resolves.toEqual({ id: expect.any(String) });
    expect(insertSingle).toHaveBeenCalled();
    expect(errorSpy).toHaveBeenCalledWith(
      '[Official API] changelog write failed (mutation kept):',
      expect.objectContaining({
        entityType: 'official_powers',
        operation: 'create',
        failure: 'changelog_record_threw',
      }),
    );
    assertLogArgumentsExcludeCanary(errorSpy, canary);
    expect(revalidateSpy).toHaveBeenCalled();

    errorSpy.mockRestore();
    revalidateSpy.mockRestore();
  });

  it('returns success when changelog rejects with a non-Error throw (no raw value in logs)', async () => {
    mockRequireLiveAdminSession.mockResolvedValue({ ok: true, userId: USER.uid });
    const canary = 'PRIVATE_CANARY_STRING_9b2e';
    vi.mocked(recordCodexChange).mockRejectedValueOnce(`changelog string throw ${canary}`);
    const { insertSingle } = mockOfficialPowerCreateSupabase();
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const revalidateSpy = vi.spyOn(nextCache, 'revalidateTag').mockImplementation(() => {});

    const response = await POST(makePostRequest('powers'), params('powers'));

    expect(response.status).toBe(200);
    await expect(readJson(response)).resolves.toEqual({ id: expect.any(String) });
    expect(insertSingle).toHaveBeenCalled();
    expect(errorSpy).toHaveBeenCalledWith(
      '[Official API] changelog write failed (mutation kept):',
      expect.objectContaining({
        entityType: 'official_powers',
        operation: 'create',
        failure: 'changelog_record_threw',
      }),
    );
    assertLogArgumentsExcludeCanary(errorSpy, canary);
    expect(revalidateSpy).toHaveBeenCalled();

    errorSpy.mockRestore();
    revalidateSpy.mockRestore();
  });

  it('creates an official creature with nonempty skill objects', async () => {
    mockRequireLiveAdminSession.mockResolvedValue({ ok: true, userId: USER.uid });
    const insertSingle = vi.fn(async () => ({ data: { id: 'creature-new' }, error: null }));
    const supabase = {
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          ilike: vi.fn().mockReturnThis(),
          neq: vi.fn().mockReturnThis(),
          limit: vi.fn().mockReturnThis(),
          maybeSingle: vi.fn(async () => ({ data: null, error: null })),
        })),
        insert: vi.fn(() => ({
          select: vi.fn(() => ({ single: insertSingle })),
        })),
      })),
    };
    mockCreateServiceRoleClient.mockReturnValue(supabase as never);

    const request = new NextRequest('http://localhost/api/official/creatures', {
      method: 'POST',
      headers: { 'content-type': 'application/json', origin: 'http://localhost' },
      body: JSON.stringify({
        name: 'Official wolf',
        level: 1,
        archetypeType: 'power',
        skills: [{ name: 'Athletics', value: 2, proficient: true }],
      }),
    });

    const response = await POST(request, params('creatures'));

    expect(response.status).toBe(200);
    await expect(readJson(response)).resolves.toEqual({ id: expect.any(String) });
  });

  it('returns 400 for malformed official creature skills without writing', async () => {
    mockRequireLiveAdminSession.mockResolvedValue({ ok: true, userId: USER.uid });
    const insertSingle = vi.fn();
    mockCreateServiceRoleClient.mockReturnValue({
      from: vi.fn(() => ({
        insert: vi.fn(() => ({
          select: vi.fn(() => ({ single: insertSingle })),
        })),
      })),
    } as never);

    const request = new NextRequest('http://localhost/api/official/creatures', {
      method: 'POST',
      headers: { 'content-type': 'application/json', origin: 'http://localhost' },
      body: JSON.stringify({
        name: 'Bad official wolf',
        skills: [{ name: 'Athletics', value: 1, proficient: 'yes' }],
      }),
    });

    const response = await POST(request, params('creatures'));

    expect(response.status).toBe(400);
    expect(insertSingle).not.toHaveBeenCalled();
  });

  function mockOfficialPostSupabase(options: {
    currentRow: Record<string, unknown> | null;
    nameCollision: Record<string, unknown> | null;
    updateRows: Record<string, unknown>[];
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
        if (selectCall === 1 || selectCall === 2) {
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
    mockRequireLiveAdminSession.mockResolvedValue({ ok: true, userId: USER.uid });

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
    mockRequireLiveAdminSession.mockResolvedValue({ ok: true, userId: USER.uid });

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

  it('persists new image_id and null image_url when admin changes bank art on update', async () => {
    mockRequireLiveAdminSession.mockResolvedValue({ ok: true, userId: USER.uid });

    const existingId = '44444444-4444-4444-4444-444444444444';
    const newImageId = '55555555-5555-4555-8555-555555555555';
    const { supabase, update } = mockOfficialPostSupabase({
      currentRow: {
        id: existingId,
        name: 'Bolt',
        image_id: '66666666-6666-4666-8666-666666666666',
        image_url: 'https://old.example/art.jpg',
      },
      nameCollision: null,
      updateRows: [{ id: existingId, image_id: newImageId, image_url: null }],
    });
    mockCreateServiceRoleClient.mockReturnValue(supabase as never);

    const request = new NextRequest('http://localhost/api/official/powers', {
      method: 'POST',
      headers: { 'content-type': 'application/json', origin: 'http://localhost' },
      body: JSON.stringify({
        id: existingId,
        name: 'Bolt',
        imageId: newImageId,
        imageUrl: 'https://evil.example/art.jpg',
      }),
    });

    const response = await POST(request, params('powers'));

    expect(response.status).toBe(200);
    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({
        image_id: newImageId,
        image_url: null,
      }),
    );
  });

  it('allows update when the name is unchanged even if another row shares that name', async () => {
    mockRequireLiveAdminSession.mockResolvedValue({ ok: true, userId: USER.uid });

    const existingId = '33333333-3333-3333-3333-333333333333';
    const { supabase, update, selectChain } = mockOfficialPostSupabase({
      currentRow: { id: existingId, name: 'Vampiric', description: 'prior text' },
      nameCollision: { id: 'duplicate-row' },
      updateRows: [{ id: existingId, name: 'Vampiric', description: 'updated text' }],
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
    expect(recordCodexChange).toHaveBeenCalledWith(
      expect.objectContaining({
        entityType: 'official_powers',
        operation: 'update',
        changedByUserId: USER.uid,
        beforeData: expect.objectContaining({ name: 'Vampiric' }),
        afterData: expect.objectContaining({ description: 'updated text' }),
      }),
    );
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
    mockRequireLiveAdminSession.mockResolvedValue({
      ok: false,
      status: 401,
      body: { error: 'Unauthorized' },
    });

    const response = await PATCH(makePatchRequest('powers'), params('powers'));

    expect(response.status).toBe(401);
    await expect(readJson(response)).resolves.toEqual({ error: 'Unauthorized' });
    expect(mockCreateServiceRoleClient).not.toHaveBeenCalled();
  });

  it('returns 403 when the user is authenticated but not admin', async () => {
    mockRequireLiveAdminSession.mockResolvedValue({
      ok: false,
      status: 403,
      body: { error: 'Forbidden' },
    });

    const response = await PATCH(makePatchRequest('powers'), params('powers'));

    expect(response.status).toBe(403);
    await expect(readJson(response)).resolves.toEqual({ error: 'Forbidden' });
    expect(mockCreateServiceRoleClient).not.toHaveBeenCalled();
  });
});

describe('DELETE /api/official/[type]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 when session is missing', async () => {
    mockRequireLiveAdminSession.mockResolvedValue({
      ok: false,
      status: 401,
      body: { error: 'Unauthorized' },
    });

    const response = await DELETE(makeDeleteRequest('powers'), params('powers'));

    expect(response.status).toBe(401);
    await expect(readJson(response)).resolves.toEqual({ error: 'Unauthorized' });
    expect(mockCreateServiceRoleClient).not.toHaveBeenCalled();
  });

  it('returns 403 when the user is authenticated but not admin', async () => {
    mockRequireLiveAdminSession.mockResolvedValue({
      ok: false,
      status: 403,
      body: { error: 'Forbidden' },
    });

    const response = await DELETE(makeDeleteRequest('powers'), params('powers'));

    expect(response.status).toBe(403);
    await expect(readJson(response)).resolves.toEqual({ error: 'Forbidden' });
    expect(mockCreateServiceRoleClient).not.toHaveBeenCalled();
  });

  it('deletes species by non-UUID codex id', async () => {
    mockRequireLiveAdminSession.mockResolvedValue({ ok: true, userId: USER.uid });

    const selectChain = {
      eq: vi.fn(function eq() {
        return selectChain;
      }),
      maybeSingle: vi.fn(async () => ({
        data: { id: '7', name: 'Elf' },
        error: null,
      })),
    };
    const deleteChain = {
      eq: vi.fn(function eq() {
        return deleteChain;
      }),
      select: vi.fn(() => Promise.resolve({ data: [{ id: '7' }], error: null })),
    };
    const supabase = {
      from: vi.fn(() => ({
        select: vi.fn(() => selectChain),
        delete: vi.fn(() => deleteChain),
      })),
    };
    mockCreateServiceRoleClient.mockReturnValue(supabase as never);

    const response = await DELETE(makeDeleteRequest('species', '7'), params('species'));

    expect(response.status).toBe(200);
    expect(recordCodexChange).toHaveBeenCalledWith(
      expect.objectContaining({
        entityType: 'codex_species',
        operation: 'delete',
        beforeData: expect.objectContaining({ name: 'Elf' }),
        afterData: null,
      }),
    );
    expect(supabase.from).toHaveBeenCalledWith('codex_species');
    expect(deleteChain.eq).toHaveBeenCalledWith('id', '7');
  });
});
