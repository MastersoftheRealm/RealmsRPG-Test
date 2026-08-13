import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/lib/supabase/session', () => ({
  getSession: vi.fn(),
}));

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}));

vi.mock('@/lib/role-policy', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/role-policy')>();
  return {
    ...actual,
    getRolePolicyForUser: vi.fn(),
  };
});

vi.mock('@/lib/ensure-user-profile', () => ({
  ensureUserProfile: vi.fn(),
}));

vi.mock('@/lib/game/archetype-display', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/game/archetype-display')>();
  return {
    ...actual,
    fetchArchetypeNameMap: vi.fn(),
  };
});

vi.mock('@/lib/rate-limit', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/rate-limit')>();
  return {
    ...actual,
    standardLimiter: {
      check: vi.fn(() => Promise.resolve({ success: true, remaining: 29, reset: Date.now() + 60_000 })),
    },
  };
});

import { GET, POST } from './route';
import { getSession } from '@/lib/supabase/session';
import { createClient } from '@/lib/supabase/server';
import { getRolePolicyForUser } from '@/lib/role-policy';
import { ensureUserProfile } from '@/lib/ensure-user-profile';
import { fetchArchetypeNameMap } from '@/lib/game/archetype-display';
import { standardLimiter } from '@/lib/rate-limit';
import { getDefaultRolePolicy } from '@/lib/role-policy';

const mockGetSession = vi.mocked(getSession);
const mockCreateClient = vi.mocked(createClient);
const mockGetRolePolicyForUser = vi.mocked(getRolePolicyForUser);
const mockEnsureUserProfile = vi.mocked(ensureUserProfile);
const mockFetchArchetypeNameMap = vi.mocked(fetchArchetypeNameMap);
const mockStandardLimiterCheck = vi.mocked(standardLimiter.check);

const TEST_USER = { uid: 'user-123', email: 'hero@example.com' };

type MockSupabaseConfig = {
  characters?: unknown[];
  charactersError?: { message: string } | null;
  characterCount?: number;
  insertId?: string;
};

function createMockSupabase(config: MockSupabaseConfig = {}) {
  const {
    characters = [],
    charactersError = null,
    characterCount = 0,
    insertId = 'char-new-uuid',
  } = config;

  return {
    from: vi.fn((table: string) => {
      if (table === 'characters') {
        return {
          select: vi.fn((_cols?: string, opts?: { count?: string; head?: boolean }) => {
            if (opts?.head) {
              return {
                eq: vi.fn().mockResolvedValue({ count: characterCount, error: null }),
              };
            }
            return {
              eq: vi.fn().mockReturnValue({
                order: vi.fn().mockResolvedValue({ data: characters, error: charactersError }),
                maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
              }),
            };
          }),
          insert: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: { id: insertId }, error: null }),
            }),
          }),
        };
      }
      if (table === 'user_profiles') {
        return {
          upsert: vi.fn().mockResolvedValue({ error: null }),
        };
      }
      throw new Error(`Unexpected table: ${table}`);
    }),
  };
}

function makePostRequest(body: unknown, headers: Record<string, string> = {}) {
  return new NextRequest('http://localhost/api/characters', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-forwarded-for': '203.0.113.1',
      origin: 'http://localhost',
      ...headers,
    },
    body: JSON.stringify(body),
  });
}

async function readJson<T>(response: Response): Promise<T> {
  return response.json() as Promise<T>;
}

describe('GET /api/characters', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetchArchetypeNameMap.mockResolvedValue(new Map());
  });

  it('returns 401 when session is missing', async () => {
    mockGetSession.mockResolvedValue({ user: null, error: 'No session' });

    const response = await GET();

    expect(response.status).toBe(401);
    await expect(readJson(response)).resolves.toEqual({ error: 'Unauthorized' });
  });

  it('returns character summaries for an authenticated user', async () => {
    mockGetSession.mockResolvedValue({ user: TEST_USER, error: null });
    mockCreateClient.mockResolvedValue(
      createMockSupabase({
        characters: [
          {
            id: 'char-1',
            data: { name: 'Aria', level: 3, portrait: 'https://example.com/p.png' },
            updated_at: '2026-07-01T12:00:00.000Z',
            name: 'Aria',
            level: 3,
            archetype_name: 'Martial Artist',
            ancestry_name: 'Human',
            status: 'active',
            visibility: 'private',
          },
        ],
      }) as never
    );

    const response = await GET();

    expect(response.status).toBe(200);
    await expect(readJson(response)).resolves.toEqual([
      {
        id: 'char-1',
        name: 'Aria',
        level: 3,
        portrait: 'https://example.com/p.png',
        archetypeName: 'Martial Artist',
        ancestryName: 'Human',
        status: 'active',
        visibility: 'private',
        updatedAt: '2026-07-01T12:00:00.000Z',
      },
    ]);
  });

  it('returns 500 when the database query fails', async () => {
    mockGetSession.mockResolvedValue({ user: TEST_USER, error: null });
    mockCreateClient.mockResolvedValue(
      createMockSupabase({ charactersError: { message: 'db down' } }) as never
    );

    const response = await GET();

    expect(response.status).toBe(500);
    await expect(readJson(response)).resolves.toEqual({ error: 'Failed to load characters' });
  });
});

describe('POST /api/characters', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetchArchetypeNameMap.mockResolvedValue(new Map());
    mockEnsureUserProfile.mockResolvedValue(undefined);
    mockGetRolePolicyForUser.mockResolvedValue(getDefaultRolePolicy('new_player'));
    mockStandardLimiterCheck.mockResolvedValue({
      success: true,
      remaining: 29,
      reset: Date.now() + 60_000,
    });
  });

  it('returns 401 when session is missing', async () => {
    mockGetSession.mockResolvedValue({ user: null, error: 'No session' });

    const response = await POST(makePostRequest({ name: 'New Hero' }));

    expect(response.status).toBe(401);
    await expect(readJson(response)).resolves.toEqual({ error: 'Unauthorized' });
  });

  it('returns 415 when Content-Type is not JSON', async () => {
    mockGetSession.mockResolvedValue({ user: TEST_USER, error: null });

    const request = new NextRequest('http://localhost/api/characters', {
      method: 'POST',
      headers: { 'content-type': 'text/html', origin: 'http://localhost' },
      body: '<p>not json</p>',
    });

    const response = await POST(request);

    expect(response.status).toBe(415);
    await expect(readJson(response)).resolves.toEqual({
      error: 'Content-Type must be application/json',
    });
  });

  it('returns 415 for text/plain (no CORS preflight content type)', async () => {
    mockGetSession.mockResolvedValue({ user: TEST_USER, error: null });

    const request = new NextRequest('http://localhost/api/characters', {
      method: 'POST',
      headers: { 'content-type': 'text/plain', origin: 'http://localhost' },
      body: JSON.stringify({ name: 'Sneaky Hero' }),
    });

    const response = await POST(request);

    expect(response.status).toBe(415);
  });

  it('returns 403 for a cross-origin create', async () => {
    mockGetSession.mockResolvedValue({ user: TEST_USER, error: null });

    const response = await POST(
      makePostRequest({ name: 'New Hero' }, { origin: 'https://evil.example' })
    );

    expect(response.status).toBe(403);
  });

  it('returns 400 when the body fails Zod validation', async () => {
    mockGetSession.mockResolvedValue({ user: TEST_USER, error: null });

    const response = await POST(makePostRequest({ name: '' }));

    expect(response.status).toBe(400);
    const body = await readJson<{ error: string; details?: string[] }>(response);
    expect(body.error).toBe('Validation failed');
    expect(body.details?.some((d) => d.includes('name'))).toBe(true);
  });

  it('creates a character and returns the new id', async () => {
    mockGetSession.mockResolvedValue({ user: TEST_USER, error: null });
    mockCreateClient.mockResolvedValue(
      createMockSupabase({ characterCount: 1, insertId: 'created-char-id' }) as never
    );

    const response = await POST(makePostRequest({ name: 'New Hero', level: 2 }));

    expect(response.status).toBe(200);
    await expect(readJson(response)).resolves.toEqual({ id: 'created-char-id' });
    expect(mockEnsureUserProfile).toHaveBeenCalled();
  });

  it('returns 403 when the user is at the character quota', async () => {
    const policy = getDefaultRolePolicy('new_player');
    mockGetSession.mockResolvedValue({ user: TEST_USER, error: null });
    mockGetRolePolicyForUser.mockResolvedValue(policy);
    mockCreateClient.mockResolvedValue(
      createMockSupabase({ characterCount: policy.maxCharacters }) as never
    );

    const response = await POST(makePostRequest({ name: 'One Too Many' }));

    expect(response.status).toBe(403);
    const body = await readJson<{ error: string; code?: string }>(response);
    expect(body.error).toMatch(/character/i);
  });
});
