import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/lib/admin', () => ({
  requireAdminSession: vi.fn(),
}));

vi.mock('@/lib/supabase/server', () => ({
  createServiceRoleClient: vi.fn(),
}));

import { GET } from './route';
import { requireAdminSession } from '@/lib/admin';
import { createServiceRoleClient } from '@/lib/supabase/server';

const mockRequireAdminSession = vi.mocked(requireAdminSession);
const mockCreateServiceRoleClient = vi.mocked(createServiceRoleClient);

function makeGetRequest(id: string) {
  return new NextRequest(`http://localhost/api/images/${id}/usage`);
}

async function readJson<T>(response: Response): Promise<T> {
  return response.json() as Promise<T>;
}

describe('GET /api/images/[id]/usage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 when session is missing', async () => {
    mockRequireAdminSession.mockResolvedValue({
      ok: false,
      status: 401,
      body: { error: 'Unauthorized' },
    });

    const response = await GET(makeGetRequest('img-1'), {
      params: Promise.resolve({ id: 'img-1' }),
    });

    expect(response.status).toBe(401);
    await expect(readJson(response)).resolves.toEqual({ error: 'Unauthorized' });
    expect(mockCreateServiceRoleClient).not.toHaveBeenCalled();
  });

  it('returns 403 when the user is authenticated but not admin', async () => {
    mockRequireAdminSession.mockResolvedValue({
      ok: false,
      status: 403,
      body: { error: 'Forbidden' },
    });

    const response = await GET(makeGetRequest('img-1'), {
      params: Promise.resolve({ id: 'img-1' }),
    });

    expect(response.status).toBe(403);
    await expect(readJson(response)).resolves.toEqual({ error: 'Forbidden' });
    expect(mockCreateServiceRoleClient).not.toHaveBeenCalled();
  });
});
