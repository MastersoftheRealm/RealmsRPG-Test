import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/lib/supabase/session', () => ({
  getSession: vi.fn(),
}));

vi.mock('@/lib/supabase/server', () => ({
  createServiceRoleClient: vi.fn(),
}));

vi.mock('@/lib/rate-limit', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/rate-limit')>();
  return {
    ...actual,
    inviteCodeLimiter: {
      check: vi.fn(() =>
        Promise.resolve({ success: true, remaining: 9, reset: Date.now() + 60_000 }),
      ),
    },
  };
});

import { GET } from './route';
import { getSession } from '@/lib/supabase/session';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { inviteCodeLimiter } from '@/lib/rate-limit';

const mockGetSession = vi.mocked(getSession);
const mockCreateServiceRoleClient = vi.mocked(createServiceRoleClient);
const mockInviteCheck = vi.mocked(inviteCodeLimiter.check);

const USER = { uid: 'user-123', email: 'hero@example.com' };
const VALID_CODE = 'ABCDEFGH';

function createInviteLookup(row: { id: string; name: string } | null) {
  return {
    from: vi.fn((table: string) => {
      if (table !== 'campaigns') throw new Error(`Unexpected table: ${table}`);
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({ data: row, error: null }),
          }),
        }),
      };
    }),
  };
}

function makeGetRequest(code: string) {
  return new NextRequest(`http://localhost/api/campaigns/invite/${code}`, {
    headers: { 'x-forwarded-for': '203.0.113.1' },
  });
}

async function readJson<T>(response: Response): Promise<T> {
  return response.json() as Promise<T>;
}

describe('GET /api/campaigns/invite/[code]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockInviteCheck.mockResolvedValue({
      success: true,
      remaining: 9,
      reset: Date.now() + 60_000,
    });
  });

  it('returns 401 when session is missing', async () => {
    mockGetSession.mockResolvedValue({ user: null, error: 'No session' });

    const response = await GET(makeGetRequest(VALID_CODE), {
      params: Promise.resolve({ code: VALID_CODE }),
    });

    expect(response.status).toBe(401);
    await expect(readJson(response)).resolves.toEqual({ error: 'Unauthorized' });
    expect(mockCreateServiceRoleClient).not.toHaveBeenCalled();
  });

  it('returns 400 for an invalid invite code format', async () => {
    mockGetSession.mockResolvedValue({ user: USER, error: null });

    const response = await GET(makeGetRequest('not-a-code'), {
      params: Promise.resolve({ code: 'not-a-code' }),
    });

    expect(response.status).toBe(400);
    await expect(readJson(response)).resolves.toEqual({ error: 'Invalid invite code' });
    expect(mockCreateServiceRoleClient).not.toHaveBeenCalled();
  });

  it('returns 404 null for a well-formed unknown code', async () => {
    mockGetSession.mockResolvedValue({ user: USER, error: null });
    mockCreateServiceRoleClient.mockReturnValue(createInviteLookup(null) as never);

    const response = await GET(makeGetRequest(VALID_CODE), {
      params: Promise.resolve({ code: VALID_CODE }),
    });

    expect(response.status).toBe(404);
    await expect(readJson(response)).resolves.toBeNull();
  });

  it('returns id and name only for a signed-in caller with a valid code', async () => {
    mockGetSession.mockResolvedValue({ user: USER, error: null });
    mockCreateServiceRoleClient.mockReturnValue(
      createInviteLookup({ id: 'camp-1', name: 'Secret Realm' }) as never,
    );

    const response = await GET(makeGetRequest(VALID_CODE), {
      params: Promise.resolve({ code: VALID_CODE }),
    });

    expect(response.status).toBe(200);
    await expect(readJson(response)).resolves.toEqual({ id: 'camp-1', name: 'Secret Realm' });
  });
});
