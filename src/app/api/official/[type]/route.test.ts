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

import { GET, POST, DELETE } from './route';
import { getSession } from '@/lib/supabase/session';
import { isAdmin } from '@/lib/admin';
import { createClient, createServiceRoleClient } from '@/lib/supabase/server';

const mockGetSession = vi.mocked(getSession);
const mockIsAdmin = vi.mocked(isAdmin);
const mockCreateClient = vi.mocked(createClient);
const mockCreateServiceRoleClient = vi.mocked(createServiceRoleClient);

const USER = { uid: 'user-123', email: 'hero@example.com' };

function createListSupabase() {
  return {
    from: vi.fn(() => ({
      select: vi.fn().mockResolvedValue({ data: [], error: null }),
    })),
  };
}

function makeGetRequest(type: string) {
  return new NextRequest(`http://localhost/api/official/${type}`);
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
