import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/lib/admin', () => ({
  requireAdminSession: vi.fn(),
}));

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}));

import { GET, POST, PATCH, DELETE } from './route';
import { requireAdminSession } from '@/lib/admin';
import { createClient } from '@/lib/supabase/server';

const mockRequireAdminSession = vi.mocked(requireAdminSession);
const mockCreateClient = vi.mocked(createClient);

function createListSupabase() {
  return {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnValue({
        order: vi.fn().mockResolvedValue({ data: [], error: null }),
      }),
    })),
  };
}

function makePostRequest() {
  return new NextRequest('http://localhost/api/official/enhanced-items', {
    method: 'POST',
    headers: { 'content-type': 'application/json', origin: 'http://localhost' },
    body: JSON.stringify({ name: 'Spark Blade' }),
  });
}

function makePatchRequest() {
  return new NextRequest('http://localhost/api/official/enhanced-items?id=enh-1', {
    method: 'PATCH',
    headers: { 'content-type': 'application/json', origin: 'http://localhost' },
    body: JSON.stringify({ name: 'Stolen' }),
  });
}

function makeDeleteRequest() {
  return new NextRequest('http://localhost/api/official/enhanced-items?id=enh-1', {
    method: 'DELETE',
    headers: { origin: 'http://localhost' },
  });
}

async function readJson<T>(response: Response): Promise<T> {
  return response.json() as Promise<T>;
}

describe('/api/official/enhanced-items (admin-only)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('GET returns 401 when session is missing', async () => {
    mockRequireAdminSession.mockResolvedValue({
      ok: false,
      status: 401,
      body: { error: 'Unauthorized' },
    });

    const response = await GET();

    expect(response.status).toBe(401);
    await expect(readJson(response)).resolves.toEqual({ error: 'Unauthorized' });
    expect(mockCreateClient).not.toHaveBeenCalled();
  });

  it('GET returns 403 when the user is authenticated but not admin', async () => {
    mockRequireAdminSession.mockResolvedValue({
      ok: false,
      status: 403,
      body: { error: 'Forbidden' },
    });

    const response = await GET();

    expect(response.status).toBe(403);
    await expect(readJson(response)).resolves.toEqual({ error: 'Forbidden' });
  });

  it('GET returns official enhanced items for an authenticated admin', async () => {
    mockRequireAdminSession.mockResolvedValue({ ok: true, userId: 'admin-user-123' });
    mockCreateClient.mockResolvedValue(createListSupabase() as never);

    const response = await GET();

    expect(response.status).toBe(200);
    await expect(readJson(response)).resolves.toEqual([]);
  });

  it('POST returns 401 when session is missing', async () => {
    mockRequireAdminSession.mockResolvedValue({
      ok: false,
      status: 401,
      body: { error: 'Unauthorized' },
    });

    const response = await POST(makePostRequest());

    expect(response.status).toBe(401);
    await expect(readJson(response)).resolves.toEqual({ error: 'Unauthorized' });
  });

  it('POST returns 403 when the user is authenticated but not admin', async () => {
    mockRequireAdminSession.mockResolvedValue({
      ok: false,
      status: 403,
      body: { error: 'Forbidden' },
    });

    const response = await POST(makePostRequest());

    expect(response.status).toBe(403);
    await expect(readJson(response)).resolves.toEqual({ error: 'Forbidden' });
  });

  it('PATCH returns 401 when session is missing', async () => {
    mockRequireAdminSession.mockResolvedValue({
      ok: false,
      status: 401,
      body: { error: 'Unauthorized' },
    });

    const response = await PATCH(makePatchRequest());

    expect(response.status).toBe(401);
    await expect(readJson(response)).resolves.toEqual({ error: 'Unauthorized' });
  });

  it('PATCH returns 403 when the user is authenticated but not admin', async () => {
    mockRequireAdminSession.mockResolvedValue({
      ok: false,
      status: 403,
      body: { error: 'Forbidden' },
    });

    const response = await PATCH(makePatchRequest());

    expect(response.status).toBe(403);
    await expect(readJson(response)).resolves.toEqual({ error: 'Forbidden' });
  });

  it('DELETE returns 401 when session is missing', async () => {
    mockRequireAdminSession.mockResolvedValue({
      ok: false,
      status: 401,
      body: { error: 'Unauthorized' },
    });

    const response = await DELETE(makeDeleteRequest());

    expect(response.status).toBe(401);
    await expect(readJson(response)).resolves.toEqual({ error: 'Unauthorized' });
  });

  it('DELETE returns 403 when the user is authenticated but not admin', async () => {
    mockRequireAdminSession.mockResolvedValue({
      ok: false,
      status: 403,
      body: { error: 'Forbidden' },
    });

    const response = await DELETE(makeDeleteRequest());

    expect(response.status).toBe(403);
    await expect(readJson(response)).resolves.toEqual({ error: 'Forbidden' });
  });
});
