import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/lib/supabase/session', () => ({
  getSession: vi.fn(),
}));

vi.mock('@/lib/admin', () => ({
  isAdmin: vi.fn(),
}));

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
  createServiceRoleClient: vi.fn(),
}));

vi.mock('@/lib/entity-image-enrich-server', () => ({
  enrichRowsWithBankImageUrls: vi.fn(() => Promise.resolve()),
}));

import { GET, POST, PATCH, DELETE } from './route';
import { getSession } from '@/lib/supabase/session';
import { isAdmin } from '@/lib/admin';
import { createClient, createServiceRoleClient } from '@/lib/supabase/server';

const mockGetSession = vi.mocked(getSession);
const mockIsAdmin = vi.mocked(isAdmin);
const mockCreateClient = vi.mocked(createClient);
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
  });

  it('returns official items without a session (public read)', async () => {
    mockCreateClient.mockResolvedValue(createListSupabase() as never);

    const response = await GET(makeGetRequest('powers'), params('powers'));

    expect(response.status).toBe(200);
    await expect(readJson(response)).resolves.toEqual([]);
    expect(mockGetSession).not.toHaveBeenCalled();
    expect(response.headers.get('Cache-Control')).toBe('private, max-age=0, must-revalidate');
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
    mockGetSession.mockResolvedValue({ user: null, error: 'No session' });

    const response = await POST(makePostRequest('powers'), params('powers'));

    expect(response.status).toBe(401);
    await expect(readJson(response)).resolves.toEqual({ error: 'Unauthorized' });
    expect(mockCreateServiceRoleClient).not.toHaveBeenCalled();
  });

  it('returns 403 when the user is authenticated but not admin', async () => {
    mockGetSession.mockResolvedValue({ user: USER, error: null });
    mockIsAdmin.mockResolvedValue(false);

    const response = await POST(makePostRequest('powers'), params('powers'));

    expect(response.status).toBe(403);
    await expect(readJson(response)).resolves.toEqual({ error: 'Admin only' });
    expect(mockCreateServiceRoleClient).not.toHaveBeenCalled();
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
    mockGetSession.mockResolvedValue({ user: null, error: 'No session' });

    const response = await PATCH(makePatchRequest('powers'), params('powers'));

    expect(response.status).toBe(401);
    await expect(readJson(response)).resolves.toEqual({ error: 'Unauthorized' });
    expect(mockCreateServiceRoleClient).not.toHaveBeenCalled();
  });

  it('returns 403 when the user is authenticated but not admin', async () => {
    mockGetSession.mockResolvedValue({ user: USER, error: null });
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
    mockGetSession.mockResolvedValue({ user: null, error: 'No session' });

    const response = await DELETE(makeDeleteRequest('powers'), params('powers'));

    expect(response.status).toBe(401);
    await expect(readJson(response)).resolves.toEqual({ error: 'Unauthorized' });
    expect(mockCreateServiceRoleClient).not.toHaveBeenCalled();
  });

  it('returns 403 when the user is authenticated but not admin', async () => {
    mockGetSession.mockResolvedValue({ user: USER, error: null });
    mockIsAdmin.mockResolvedValue(false);

    const response = await DELETE(makeDeleteRequest('powers'), params('powers'));

    expect(response.status).toBe(403);
    await expect(readJson(response)).resolves.toEqual({ error: 'Admin only' });
    expect(mockCreateServiceRoleClient).not.toHaveBeenCalled();
  });
});
