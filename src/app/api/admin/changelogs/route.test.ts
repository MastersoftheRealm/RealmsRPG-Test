import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/lib/admin', () => ({
  requireAdminSession: vi.fn(),
}));

vi.mock('@/lib/supabase/server', () => ({
  createServiceRoleClient: vi.fn(),
}));

vi.mock('@/lib/rate-limit', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/rate-limit')>();
  return {
    ...actual,
    standardLimiter: {
      check: vi.fn(() =>
        Promise.resolve({ success: true, remaining: 29, reset: Date.now() + 60_000 }),
      ),
    },
  };
});

import { GET } from './route';
import { requireAdminSession } from '@/lib/admin';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { standardLimiter } from '@/lib/rate-limit';

const mockRequireAdminSession = vi.mocked(requireAdminSession);
const mockCreateServiceRoleClient = vi.mocked(createServiceRoleClient);
const mockStandardLimiterCheck = vi.mocked(standardLimiter.check);

const ADMIN_ID = 'admin-user-123';

function createMockServiceClient() {
  return {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue({ data: [], error: null }),
          }),
        }),
      }),
    })),
  };
}

function makeGetRequest() {
  return new NextRequest('http://localhost/api/admin/changelogs', {
    headers: { 'x-forwarded-for': '203.0.113.1' },
  });
}

async function readJson<T>(response: Response): Promise<T> {
  return response.json() as Promise<T>;
}

describe('GET /api/admin/changelogs', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockStandardLimiterCheck.mockResolvedValue({
      success: true,
      remaining: 29,
      reset: Date.now() + 60_000,
    });
  });

  it('returns 401 when session is missing', async () => {
    mockRequireAdminSession.mockResolvedValue({
      ok: false,
      status: 401,
      body: { error: 'Unauthorized' },
    });

    const response = await GET(makeGetRequest());

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

    const response = await GET(makeGetRequest());

    expect(response.status).toBe(403);
    await expect(readJson(response)).resolves.toEqual({ error: 'Forbidden' });
    expect(mockCreateServiceRoleClient).not.toHaveBeenCalled();
  });

  it('returns changelogs for an authenticated admin', async () => {
    mockRequireAdminSession.mockResolvedValue({ ok: true, userId: ADMIN_ID });
    mockCreateServiceRoleClient.mockReturnValue(createMockServiceClient() as never);

    const response = await GET(makeGetRequest());

    expect(response.status).toBe(200);
    await expect(readJson(response)).resolves.toEqual([]);
  });
});
