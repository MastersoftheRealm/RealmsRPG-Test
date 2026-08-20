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

vi.mock('@/lib/realms-images-server', () => ({
  fetchRealmsImageById: vi.fn(),
}));

import { GET, PATCH, DELETE } from './route';
import { getSession } from '@/lib/supabase/session';
import { isAdmin } from '@/lib/admin';
import { createClient, createServiceRoleClient } from '@/lib/supabase/server';
import { fetchRealmsImageById } from '@/lib/realms-images-server';

const mockGetSession = vi.mocked(getSession);
const mockIsAdmin = vi.mocked(isAdmin);
const mockCreateClient = vi.mocked(createClient);
const mockCreateServiceRoleClient = vi.mocked(createServiceRoleClient);
const mockFetchRealmsImageById = vi.mocked(fetchRealmsImageById);

const USER = { uid: 'user-123', email: 'hero@example.com' };
const IMAGE_ID = 'img-1';

const PUBLIC_IMAGE = {
  id: IMAGE_ID,
  name: 'Dagger',
  categories: ['weapon'],
  storagePath: 'realms/img-1.png',
  publicUrl: 'https://cdn.test/img-1.png',
  createdAt: '2026-08-01T00:00:00.000Z',
  updatedAt: '2026-08-01T00:00:00.000Z',
  createdBy: 'admin-user',
};

function makeGetRequest(id: string) {
  return new NextRequest(`http://localhost/api/images/${id}`);
}

function makePatchRequest(id: string) {
  return new NextRequest(`http://localhost/api/images/${id}`, {
    method: 'PATCH',
    headers: { 'content-type': 'application/json', origin: 'http://localhost' },
    body: JSON.stringify({ name: 'Stolen' }),
  });
}

function makeDeleteRequest(id: string, headers: Record<string, string> = {}) {
  return new NextRequest(`http://localhost/api/images/${id}`, {
    method: 'DELETE',
    headers: { origin: 'http://localhost', ...headers },
  });
}

async function readJson<T>(response: Response): Promise<T> {
  return response.json() as Promise<T>;
}

const params = (id: string) => ({ params: Promise.resolve({ id }) });

describe('GET /api/images/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns a public image without a session', async () => {
    mockCreateClient.mockResolvedValue({} as never);
    mockFetchRealmsImageById.mockResolvedValue(PUBLIC_IMAGE as never);

    const response = await GET(makeGetRequest(IMAGE_ID), params(IMAGE_ID));

    expect(response.status).toBe(200);
    const body = await readJson<{ id: string; name: string }>(response);
    expect(body.id).toBe(IMAGE_ID);
    expect(body.name).toBe('Dagger');
    expect(mockGetSession).not.toHaveBeenCalled();
  });
});

describe('PATCH /api/images/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 when session is missing', async () => {
    mockGetSession.mockResolvedValue({ user: null, error: 'No session' });

    const response = await PATCH(makePatchRequest(IMAGE_ID), params(IMAGE_ID));

    expect(response.status).toBe(401);
    await expect(readJson(response)).resolves.toEqual({ error: 'Unauthorized' });
    expect(mockCreateServiceRoleClient).not.toHaveBeenCalled();
  });

  it('returns 403 when the user is authenticated but not admin', async () => {
    mockGetSession.mockResolvedValue({ user: USER, error: null });
    mockIsAdmin.mockResolvedValue(false);

    const response = await PATCH(makePatchRequest(IMAGE_ID), params(IMAGE_ID));

    expect(response.status).toBe(403);
    await expect(readJson(response)).resolves.toEqual({ error: 'Admin access required' });
    expect(mockCreateServiceRoleClient).not.toHaveBeenCalled();
  });
});

describe('DELETE /api/images/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 when session is missing', async () => {
    mockGetSession.mockResolvedValue({ user: null, error: 'No session' });

    const response = await DELETE(makeDeleteRequest(IMAGE_ID), params(IMAGE_ID));

    expect(response.status).toBe(401);
    await expect(readJson(response)).resolves.toEqual({ error: 'Unauthorized' });
  });

  it('returns 403 when the user is authenticated but not admin', async () => {
    mockGetSession.mockResolvedValue({ user: USER, error: null });
    mockIsAdmin.mockResolvedValue(false);

    const response = await DELETE(makeDeleteRequest(IMAGE_ID), params(IMAGE_ID));

    expect(response.status).toBe(403);
    await expect(readJson(response)).resolves.toEqual({ error: 'Admin access required' });
    expect(mockCreateServiceRoleClient).not.toHaveBeenCalled();
  });
});
