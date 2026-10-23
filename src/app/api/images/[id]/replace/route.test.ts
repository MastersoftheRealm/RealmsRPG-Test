import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/lib/supabase/session', () => ({
  requireLiveUser: vi.fn(),
}));

vi.mock('@/lib/admin', () => ({
  isAdmin: vi.fn(),
}));

vi.mock('@/lib/supabase/server', () => ({
  createServiceRoleClient: vi.fn(),
}));

import { POST } from './route';
import { requireLiveUser } from '@/lib/supabase/session';
import { isAdmin } from '@/lib/admin';
import { createServiceRoleClient } from '@/lib/supabase/server';

const mockRequireLiveUser = vi.mocked(requireLiveUser);
const mockIsAdmin = vi.mocked(isAdmin);
const mockCreateServiceRoleClient = vi.mocked(createServiceRoleClient);

const USER = { uid: 'user-123', email: 'hero@example.com' };

function makePostRequest(id: string) {
  return new NextRequest(`http://localhost/api/images/${id}/replace`, {
    method: 'POST',
    headers: { origin: 'http://localhost' },
  });
}

async function readJson<T>(response: Response): Promise<T> {
  return response.json() as Promise<T>;
}

describe('POST /api/images/[id]/replace', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 when session is missing', async () => {
    mockRequireLiveUser.mockRejectedValue(new Error('Authentication required'));

    const response = await POST(makePostRequest('img-1'), {
      params: Promise.resolve({ id: 'img-1' }),
    });

    expect(response.status).toBe(401);
    await expect(readJson(response)).resolves.toEqual({ error: 'Unauthorized' });
    expect(mockCreateServiceRoleClient).not.toHaveBeenCalled();
  });

  it('returns 403 when the user is authenticated but not admin', async () => {
    mockRequireLiveUser.mockResolvedValue(USER);
    mockIsAdmin.mockResolvedValue(false);

    const response = await POST(makePostRequest('img-1'), {
      params: Promise.resolve({ id: 'img-1' }),
    });

    expect(response.status).toBe(403);
    await expect(readJson(response)).resolves.toEqual({ error: 'Admin access required' });
    expect(mockCreateServiceRoleClient).not.toHaveBeenCalled();
  });
});
