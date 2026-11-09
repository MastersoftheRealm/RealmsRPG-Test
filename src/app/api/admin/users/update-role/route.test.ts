import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/lib/admin', () => ({
  requireLiveAdminSession: vi.fn(),
}));

vi.mock('@/lib/supabase/server', () => ({
  createServiceRoleClient: vi.fn(),
}));

vi.mock('@/lib/rate-limit', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/rate-limit')>();
  return {
    ...actual,
    strictLimiter: {
      check: vi.fn(() =>
        Promise.resolve({ success: true, remaining: 9, reset: Date.now() + 60_000 }),
      ),
    },
  };
});

import { PATCH } from './route';
import { requireLiveAdminSession } from '@/lib/admin';
import { createServiceRoleClient } from '@/lib/supabase/server';

const mockRequireLiveAdminSession = vi.mocked(requireLiveAdminSession);
const mockCreateServiceRoleClient = vi.mocked(createServiceRoleClient);

const ADMIN_ID = 'admin-user-123';

function createMockServiceRoleClient() {
  return {
    from: (table: string) => {
      if (table === 'user_profiles') {
        return {
          select: () => ({
            limit: () => ({
              eq: () => ({
                maybeSingle: () =>
                  Promise.resolve({
                    data: { id: 'looked-up-user', role: 'new_player' },
                    error: null,
                  }),
              }),
            }),
          }),
          update: () => ({
            eq: () => Promise.resolve({ error: null }),
          }),
        };
      }
      if (table === 'admin_role_audit') {
        return {
          insert: () => Promise.resolve({ error: null }),
        };
      }
      throw new Error(`unexpected table ${table}`);
    },
  };
}

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
    mockRequireLiveAdminSession.mockResolvedValue({
      ok: false,
      status: 401,
      body: { error: 'Unauthorized' },
    });

    const response = await PATCH(makePatchRequest());

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

    const response = await PATCH(makePatchRequest());

    expect(response.status).toBe(403);
    await expect(readJson(response)).resolves.toEqual({ error: 'Forbidden' });
    expect(mockCreateServiceRoleClient).not.toHaveBeenCalled();
  });

  it('updates role via createServiceRoleClient after admin auth', async () => {
    mockRequireLiveAdminSession.mockResolvedValue({ ok: true, userId: ADMIN_ID });
    mockCreateServiceRoleClient.mockReturnValue(createMockServiceRoleClient() as never);

    const response = await PATCH(makePatchRequest());

    expect(response.status).toBe(200);
    await expect(readJson(response)).resolves.toEqual({
      success: true,
      userId: 'looked-up-user',
      role: 'playtester',
    });
    expect(mockCreateServiceRoleClient).toHaveBeenCalledTimes(1);
  });
});
