import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/lib/admin', () => ({
  requireAdminSession: vi.fn(),
}));

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}));

import { GET, PATCH } from './route';
import { requireAdminSession } from '@/lib/admin';
import { createClient } from '@/lib/supabase/server';

const mockRequireAdminSession = vi.mocked(requireAdminSession);
const mockCreateClient = vi.mocked(createClient);

function createMockSupabase() {
  return {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnValue({
        order: vi.fn().mockResolvedValue({ data: [], error: null }),
      }),
    })),
  };
}

function makePatchRequest() {
  return new NextRequest('http://localhost/api/admin/role-policies', {
    method: 'PATCH',
    headers: {
      'content-type': 'application/json',
      origin: 'http://localhost',
      'x-forwarded-for': '203.0.113.1',
    },
    body: JSON.stringify({ role: 'playtester', maxCampaigns: 3 }),
  });
}

async function readJson<T>(response: Response): Promise<T> {
  return response.json() as Promise<T>;
}

describe('GET /api/admin/role-policies', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 when session is missing', async () => {
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

  it('returns 403 when the user is authenticated but not admin', async () => {
    mockRequireAdminSession.mockResolvedValue({
      ok: false,
      status: 403,
      body: { error: 'Forbidden' },
    });

    const response = await GET();

    expect(response.status).toBe(403);
    await expect(readJson(response)).resolves.toEqual({ error: 'Forbidden' });
  });

  it('returns policies for an authenticated admin', async () => {
    mockRequireAdminSession.mockResolvedValue({ ok: true, userId: 'admin-user-123' });
    mockCreateClient.mockResolvedValue(createMockSupabase() as never);

    const response = await GET();

    expect(response.status).toBe(200);
    await expect(readJson(response)).resolves.toEqual([]);
  });
});

describe('PATCH /api/admin/role-policies', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 when session is missing', async () => {
    mockRequireAdminSession.mockResolvedValue({
      ok: false,
      status: 401,
      body: { error: 'Unauthorized' },
    });

    const response = await PATCH(makePatchRequest());

    expect(response.status).toBe(401);
    await expect(readJson(response)).resolves.toEqual({ error: 'Unauthorized' });
    expect(mockCreateClient).not.toHaveBeenCalled();
  });

  it('returns 403 when the user is authenticated but not admin', async () => {
    mockRequireAdminSession.mockResolvedValue({
      ok: false,
      status: 403,
      body: { error: 'Forbidden' },
    });

    const response = await PATCH(makePatchRequest());

    expect(response.status).toBe(403);
    await expect(readJson(response)).resolves.toEqual({ error: 'Forbidden' });
    expect(mockCreateClient).not.toHaveBeenCalled();
  });
});
