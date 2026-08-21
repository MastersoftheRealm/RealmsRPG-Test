import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/lib/admin', () => ({
  requireAdminSession: vi.fn(),
}));

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(),
}));

import { PATCH } from './route';
import { requireAdminSession } from '@/lib/admin';
import { createClient as createSupabaseAdminClient } from '@supabase/supabase-js';

const mockRequireAdminSession = vi.mocked(requireAdminSession);
const mockCreateSupabaseAdminClient = vi.mocked(createSupabaseAdminClient);

function makePatchRequest() {
  return new NextRequest('http://localhost/api/admin/users/update-role', {
    method: 'PATCH',
    headers: {
      'content-type': 'application/json',
      origin: 'http://localhost',
      'x-forwarded-for': '203.0.113.1',
    },
    body: JSON.stringify({ userId: 'target-user', role: 'playtester' }),
  });
}

async function readJson<T>(response: Response): Promise<T> {
  return response.json() as Promise<T>;
}

describe('PATCH /api/admin/users/update-role', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = {
      ...originalEnv,
      NEXT_PUBLIC_SUPABASE_URL: 'https://test.supabase.co',
      SUPABASE_SERVICE_ROLE_KEY: 'test-service-role-key',
    };
  });

  afterEach(() => {
    process.env = originalEnv;
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
    expect(mockCreateSupabaseAdminClient).not.toHaveBeenCalled();
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
    expect(mockCreateSupabaseAdminClient).not.toHaveBeenCalled();
  });
});
