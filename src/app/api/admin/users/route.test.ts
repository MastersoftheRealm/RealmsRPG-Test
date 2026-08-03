import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/lib/admin', () => ({
  requireAdminSession: vi.fn(),
}));

vi.mock('@/lib/rate-limit', () => ({
  buildRateLimitKey: vi.fn(() => 'admin-users-get:test'),
  resolveClientIp: vi.fn(() => '203.0.113.1'),
  retryAfterSecondsFromReset: vi.fn(() => '60'),
  standardLimiter: {
    check: vi.fn(() => Promise.resolve({ success: true, remaining: 29, reset: Date.now() + 60_000 })),
  },
}));

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(),
}));

import { GET } from './route';
import { requireAdminSession } from '@/lib/admin';
import { createClient as createSupabaseAdminClient } from '@supabase/supabase-js';
import { standardLimiter } from '@/lib/rate-limit';

const mockRequireAdminSession = vi.mocked(requireAdminSession);
const mockCreateSupabaseAdminClient = vi.mocked(createSupabaseAdminClient);
const mockStandardLimiterCheck = vi.mocked(standardLimiter.check);

const ADMIN_ID = 'admin-user-123';

function createMockSupabaseAdmin(profiles: unknown[] = [], error: { message: string } | null = null) {
  return {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnValue({
        order: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue({ data: profiles, error }),
        }),
      }),
    })),
  };
}

function makeGetRequest() {
  return new NextRequest('http://localhost/api/admin/users', {
    headers: { 'x-forwarded-for': '203.0.113.1' },
  });
}

async function readJson<T>(response: Response): Promise<T> {
  return response.json() as Promise<T>;
}

describe('GET /api/admin/users', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = {
      ...originalEnv,
      NEXT_PUBLIC_SUPABASE_URL: 'https://test.supabase.co',
      SUPABASE_SERVICE_ROLE_KEY: 'test-service-role-key',
    };
    mockStandardLimiterCheck.mockResolvedValue({
      success: true,
      remaining: 29,
      reset: Date.now() + 60_000,
    });
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

    const response = await GET(makeGetRequest());

    expect(response.status).toBe(401);
    await expect(readJson(response)).resolves.toEqual({ error: 'Unauthorized' });
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
  });

  it('returns user list for an authenticated admin', async () => {
    mockRequireAdminSession.mockResolvedValue({ ok: true, userId: ADMIN_ID });
    mockCreateSupabaseAdminClient.mockReturnValue(
      createMockSupabaseAdmin([
        {
          id: 'user-1',
          username: 'hero',
          username_display: 'Hero',
          email: 'hero@example.com',
          display_name: 'Hero Player',
          role: 'new_player',
        },
      ]) as never
    );

    const response = await GET(makeGetRequest());

    expect(response.status).toBe(200);
    await expect(readJson(response)).resolves.toEqual([
      {
        id: 'user-1',
        username: 'hero',
        usernameDisplay: 'Hero',
        email: 'hero@example.com',
        displayName: 'Hero Player',
        role: 'new_player',
      },
    ]);
  });

  it('returns 429 when rate limited', async () => {
    mockRequireAdminSession.mockResolvedValue({ ok: true, userId: ADMIN_ID });
    mockStandardLimiterCheck.mockResolvedValue({
      success: false,
      remaining: 0,
      reset: Date.now() + 60_000,
    });

    const response = await GET(makeGetRequest());

    expect(response.status).toBe(429);
    await expect(readJson(response)).resolves.toEqual({ error: 'Too many requests' });
  });
});
