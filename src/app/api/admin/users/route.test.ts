import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';
import {
  compareAdminUserProfilesForListing,
  profileMatchesAdminUserSearch,
} from '@/lib/admin-users-search';

vi.mock('@/lib/admin', () => ({
  requireAdminSession: vi.fn(),
}));

vi.mock('@/lib/rate-limit', () => ({
  buildRateLimitKey: vi.fn(() => 'admin-users-get:test'),
  resolveClientIp: vi.fn(() => '203.0.113.1'),
  retryAfterSecondsFromReset: vi.fn(() => '60'),
  standardLimiter: {
    check: vi.fn(() =>
      Promise.resolve({ success: true, remaining: 29, reset: Date.now() + 60_000 }),
    ),
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

type ProfileRow = {
  id: string;
  username: string | null;
  username_display: string | null;
  email: string | null;
  display_name: string | null;
  role: string;
};

function createMockSupabaseAdmin(
  profiles: ProfileRow[] = [],
  error: { message: string } | null = null,
  options?: {
    onRange?: (from: number, to: number) => void;
    onOr?: (filter: string) => void;
    onOrder?: (field: string) => void;
    searchNeedle?: string | null;
  },
) {
  const buildQuery = (searchNeedle: string | null) => {
    const sorted = [...profiles].sort(compareAdminUserProfilesForListing);
    let rows = searchNeedle
      ? sorted.filter((row) => profileMatchesAdminUserSearch(row, searchNeedle))
      : sorted;
    const chain = {
      or: vi.fn((filter: string) => {
        options?.onOr?.(filter);
        if (options?.searchNeedle !== undefined) {
          rows = options.searchNeedle
            ? sorted.filter((row) => profileMatchesAdminUserSearch(row, options.searchNeedle!))
            : sorted;
        }
        return buildQuery(options?.searchNeedle ?? null);
      }),
      range: vi.fn((from: number, to: number) => {
        options?.onRange?.(from, to);
        const page = rows.slice(from, to + 1);
        return Promise.resolve({ data: page, error });
      }),
      order: vi.fn((field: string) => {
        options?.onOrder?.(field);
        return chain;
      }),
    };
    return chain;
  };
  return {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnValue(buildQuery(null)),
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
      ]) as never,
    );

    const response = await GET(makeGetRequest());

    expect(response.status).toBe(200);
    const body = await readJson<{
      users: Array<{ id: string; username: string }>;
      offset: number;
      limit: number;
      hasMore: boolean;
    }>(response);
    expect(body.users).toEqual([
      {
        id: 'user-1',
        username: 'hero',
        usernameDisplay: 'Hero',
        email: 'hero@example.com',
        displayName: 'Hero Player',
        role: 'new_player',
      },
    ]);
    expect(body.offset).toBe(0);
    expect(body.limit).toBe(100);
    expect(body.hasMore).toBe(false);
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

  it('API-025: caps limit at 100 and applies offset', async () => {
    mockRequireAdminSession.mockResolvedValue({ ok: true, userId: ADMIN_ID });
    let ranged: [number, number] | null = null;
    mockCreateSupabaseAdminClient.mockReturnValue(
      createMockSupabaseAdmin([], null, {
        onRange: (from, to) => {
          ranged = [from, to];
        },
      }) as never,
    );

    const request = new NextRequest('http://localhost/api/admin/users?limit=500&offset=10', {
      headers: { 'x-forwarded-for': '203.0.113.1' },
    });
    const response = await GET(request);

    expect(response.status).toBe(200);
    expect(ranged).toEqual([10, 109]);
  });

  it('API-025: offset 100 returns user 101+ and server search can find a later user', async () => {
    mockRequireAdminSession.mockResolvedValue({ ok: true, userId: ADMIN_ID });
    const directory = Array.from({ length: 201 }, (_, i) => ({
      id: `uid-${String(i + 1).padStart(4, '0')}`,
      username: `user${String(i + 1).padStart(3, '0')}`,
      username_display: `User ${i + 1}`,
      email: `user${i + 1}@example.com`,
      display_name: `Player ${i + 1}`,
      role: 'new_player',
    }));
    let ranged: [number, number] | null = null;
    mockCreateSupabaseAdminClient.mockReturnValue(
      createMockSupabaseAdmin(directory, null, {
        onRange: (from, to) => {
          ranged = [from, to];
        },
      }) as never,
    );

    const page2 = await GET(
      new NextRequest('http://localhost/api/admin/users?offset=100&limit=100', {
        headers: { 'x-forwarded-for': '203.0.113.1' },
      }),
    );
    const page2Body = await readJson<{
      users: Array<{ id: string; username: string }>;
      hasMore: boolean;
    }>(page2);
    expect(page2.status).toBe(200);
    expect(ranged).toEqual([100, 199]);
    expect(page2Body.users[0]?.id).toBe('uid-0101');
    expect(page2Body.hasMore).toBe(true);

    let orFilter: string | null = null;
    mockCreateSupabaseAdminClient.mockReturnValue(
      createMockSupabaseAdmin(directory, null, {
        searchNeedle: 'user150',
        onOr: (filter) => {
          orFilter = filter;
        },
      }) as never,
    );
    const search = await GET(
      new NextRequest('http://localhost/api/admin/users?q=user150', {
        headers: { 'x-forwarded-for': '203.0.113.1' },
      }),
    );
    const searchBody = await readJson<{ users: Array<{ username: string }> }>(search);
    expect(search.status).toBe(200);
    expect(orFilter).toContain('user150');
    expect(searchBody.users.some((u) => u.username === 'user150')).toBe(true);
  });

  it('orders by username then id and pages tied null usernames without duplicates', async () => {
    mockRequireAdminSession.mockResolvedValue({ ok: true, userId: ADMIN_ID });
    const orderFields: string[] = [];
    const directory: ProfileRow[] = [
      {
        id: 'uid-002',
        username: null,
        username_display: 'B',
        email: 'b@example.com',
        display_name: null,
        role: 'new_player',
      },
      {
        id: 'uid-001',
        username: null,
        username_display: 'A',
        email: 'a@example.com',
        display_name: null,
        role: 'new_player',
      },
      {
        id: 'uid-003',
        username: 'zulu',
        username_display: 'Z',
        email: 'z@example.com',
        display_name: null,
        role: 'new_player',
      },
    ];
    mockCreateSupabaseAdminClient.mockReturnValue(
      createMockSupabaseAdmin(directory, null, {
        onOrder: (field) => orderFields.push(field),
      }) as never,
    );

    const page1 = await readJson<{ users: Array<{ id: string }> }>(
      await GET(
        new NextRequest('http://localhost/api/admin/users?limit=2&offset=0', {
          headers: { 'x-forwarded-for': '203.0.113.1' },
        }),
      ),
    );
    const page2 = await readJson<{ users: Array<{ id: string }> }>(
      await GET(
        new NextRequest('http://localhost/api/admin/users?limit=2&offset=2', {
          headers: { 'x-forwarded-for': '203.0.113.1' },
        }),
      ),
    );

    expect(orderFields[0]).toBe('username');
    expect(orderFields[1]).toBe('id');
    expect(page1.users.map((u) => u.id)).toEqual(['uid-001', 'uid-002']);
    expect(page2.users.map((u) => u.id)).toEqual(['uid-003']);
    const allIds = [...page1.users, ...page2.users].map((u) => u.id);
    expect(new Set(allIds).size).toBe(3);
  });

  it('quotes search literals and matches role labels in the PostgREST filter', async () => {
    mockRequireAdminSession.mockResolvedValue({ ok: true, userId: ADMIN_ID });
    const cases: Array<{ q: string; check: (filter: string) => void }> = [
      {
        q: 'Doe, Jane',
        check: (filter) => {
          expect(filter).toContain('display_name.ilike."%Doe, Jane%"');
        },
      },
      {
        q: 'O"Brien',
        check: (filter) => {
          expect(filter).toContain('email.ilike."%O\\"Brien%"');
        },
      },
      {
        q: '(parens)',
        check: (filter) => expect(filter).toContain('ilike."%(parens)%"'),
      },
      {
        q: 'playtest',
        check: (filter) => expect(filter).toContain('role.in.(playtester)'),
      },
    ];

    for (const { q, check } of cases) {
      let orFilter = '';
      mockCreateSupabaseAdminClient.mockReturnValue(
        createMockSupabaseAdmin(
          [
            {
              id: 'pt-1',
              username: 'pt',
              username_display: 'pt',
              email: 'pt@example.com',
              display_name: 'pt',
              role: 'playtester',
            },
          ],
          null,
          {
            searchNeedle: q,
            onOr: (filter) => {
              orFilter = filter;
            },
          },
        ) as never,
      );
      const response = await GET(
        new NextRequest(`http://localhost/api/admin/users?q=${encodeURIComponent(q)}`, {
          headers: { 'x-forwarded-for': '203.0.113.1' },
        }),
      );
      expect(response.status).toBe(200);
      check(orFilter);
    }
  });
});
