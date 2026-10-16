import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/lib/supabase/session', () => ({
  getSession: vi.fn(),
}));

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
  createServiceRoleClient: vi.fn(),
}));

vi.mock('@/lib/role-policy', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/role-policy')>();
  return {
    ...actual,
    getRolePolicyForUser: vi.fn(),
  };
});

vi.mock('@/lib/rate-limit', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/rate-limit')>();
  return {
    ...actual,
    uploadLimiter: {
      check: vi.fn(() =>
        Promise.resolve({ success: true, remaining: 9, reset: Date.now() + 60_000 }),
      ),
    },
  };
});

import { DELETE, POST } from './route';
import { getSession } from '@/lib/supabase/session';
import { createClient, createServiceRoleClient } from '@/lib/supabase/server';
import { getDefaultRolePolicy, getRolePolicyForUser } from '@/lib/role-policy';
import { uploadLimiter } from '@/lib/rate-limit';

const mockGetSession = vi.mocked(getSession);
const mockCreateClient = vi.mocked(createClient);
const mockCreateServiceRoleClient = vi.mocked(createServiceRoleClient);
const mockGetRolePolicyForUser = vi.mocked(getRolePolicyForUser);
const mockUploadLimiterCheck = vi.mocked(uploadLimiter.check);

const USER = { uid: 'user-123', email: 'hero@example.com' };

function makePostRequest() {
  return new NextRequest('http://localhost/api/upload/profile-picture', {
    method: 'POST',
    headers: { origin: 'http://localhost' },
  });
}

function makeDeleteRequest() {
  return new NextRequest('http://localhost/api/upload/profile-picture', {
    method: 'DELETE',
    headers: { origin: 'http://localhost' },
  });
}

async function readJson<T>(response: Response): Promise<T> {
  return response.json() as Promise<T>;
}

describe('POST /api/upload/profile-picture', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUploadLimiterCheck.mockResolvedValue({
      success: true,
      remaining: 9,
      reset: Date.now() + 60_000,
    });
    mockCreateClient.mockResolvedValue({} as never);
  });

  it('returns 401 when session is missing', async () => {
    mockGetSession.mockResolvedValue({ user: null, error: 'No session' });

    const response = await POST(makePostRequest());

    expect(response.status).toBe(401);
    await expect(readJson(response)).resolves.toEqual({ error: 'Unauthorized' });
    expect(mockGetRolePolicyForUser).not.toHaveBeenCalled();
  });

  it('returns 403 when the caller role cannot upload profile pictures', async () => {
    mockGetSession.mockResolvedValue({ user: USER, error: null });
    mockGetRolePolicyForUser.mockResolvedValue(getDefaultRolePolicy('new_player'));

    const response = await POST(makePostRequest());

    expect(response.status).toBe(403);
    await expect(readJson(response)).resolves.toEqual({
      error: 'Your role cannot upload profile pictures.',
    });
  });
});

describe('DELETE /api/upload/profile-picture', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUploadLimiterCheck.mockResolvedValue({
      success: true,
      remaining: 9,
      reset: Date.now() + 60_000,
    });
    mockCreateServiceRoleClient.mockReturnValue({
      storage: {
        from: () => ({
          list: vi.fn(() => Promise.resolve({ data: [], error: null })),
          remove: vi.fn(() => Promise.resolve({ error: null })),
        }),
      },
      from: vi.fn(() => ({})),
    } as never);
  });

  it('returns 401 when session is missing', async () => {
    mockGetSession.mockResolvedValue({ user: null, error: 'No session' });

    const response = await DELETE(makeDeleteRequest());

    expect(response.status).toBe(401);
    await expect(readJson(response)).resolves.toEqual({ error: 'Unauthorized' });
  });

  it('clears photo_url and returns 204', async () => {
    mockGetSession.mockResolvedValue({ user: USER, error: null });
    const updateEq = vi.fn(() => Promise.resolve({ error: null }));
    const update = vi.fn(() => ({ eq: updateEq }));
    mockCreateServiceRoleClient.mockReturnValue({
      storage: {
        from: () => ({
          list: vi.fn(() => Promise.resolve({ data: [], error: null })),
          remove: vi.fn(() => Promise.resolve({ error: null })),
        }),
      },
      from: vi.fn((table: string) => {
        if (table === 'user_profiles') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                maybeSingle: vi.fn(() =>
                  Promise.resolve({
                    data: { photo_url: 'https://cdn.test/profile-pictures/user-123.png' },
                    error: null,
                  }),
                ),
              })),
            })),
            update,
          };
        }
        return {};
      }),
    } as never);

    const response = await DELETE(makeDeleteRequest());

    expect(response.status).toBe(204);
    expect(update).toHaveBeenCalledWith(expect.objectContaining({ photo_url: null }));
  });
});
