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

import { POST } from './route';
import { getSession } from '@/lib/supabase/session';
import { createClient } from '@/lib/supabase/server';
import { getDefaultRolePolicy, getRolePolicyForUser } from '@/lib/role-policy';
import { uploadLimiter } from '@/lib/rate-limit';

const mockGetSession = vi.mocked(getSession);
const mockCreateClient = vi.mocked(createClient);
const mockGetRolePolicyForUser = vi.mocked(getRolePolicyForUser);
const mockUploadLimiterCheck = vi.mocked(uploadLimiter.check);

const USER = { uid: 'user-123', email: 'hero@example.com' };

function makePostRequest() {
  return new NextRequest('http://localhost/api/upload/profile-picture', {
    method: 'POST',
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
