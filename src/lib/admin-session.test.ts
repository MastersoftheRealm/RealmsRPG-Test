import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/supabase/session', () => ({
  getSession: vi.fn(),
  requireLiveUser: vi.fn(),
}));

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}));

import { requireAdminSession } from '@/lib/admin';
import { getSession } from '@/lib/supabase/session';
import { createClient } from '@/lib/supabase/server';

const mockGetSession = vi.mocked(getSession);
const mockCreateClient = vi.mocked(createClient);

function profileClient(role: string | null) {
  return {
    from: () => ({
      select: () => ({
        eq: () => ({
          maybeSingle: async () => ({ data: role ? { role } : null, error: null }),
        }),
      }),
    }),
  };
}

describe('requireAdminSession', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 when getSession has no user', async () => {
    mockGetSession.mockResolvedValue({ user: null, error: 'No session' });

    await expect(requireAdminSession()).resolves.toEqual({
      ok: false,
      status: 401,
      body: { error: 'Unauthorized' },
    });
    expect(mockCreateClient).not.toHaveBeenCalled();
  });

  it('returns 403 when the session user is not an admin', async () => {
    mockGetSession.mockResolvedValue({ user: { uid: 'user-1' }, error: null });
    mockCreateClient.mockResolvedValue(profileClient('player') as never);

    await expect(requireAdminSession()).resolves.toEqual({
      ok: false,
      status: 403,
      body: { error: 'Forbidden' },
    });
  });

  it('returns the admin id when getSession has an admin', async () => {
    mockGetSession.mockResolvedValue({ user: { uid: 'admin-1' }, error: null });
    mockCreateClient.mockResolvedValue(profileClient('admin') as never);

    await expect(requireAdminSession()).resolves.toEqual({
      ok: true,
      userId: 'admin-1',
    });
  });
});
