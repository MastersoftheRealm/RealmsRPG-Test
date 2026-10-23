import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/supabase/session', () => ({
  getSession: vi.fn(),
  requireLiveUser: vi.fn(),
}));

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}));

import { requireLiveAdminSession } from '@/lib/admin';
import { requireLiveUser } from '@/lib/supabase/session';
import { createClient } from '@/lib/supabase/server';

const mockRequireLiveUser = vi.mocked(requireLiveUser);
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

describe('requireLiveAdminSession', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 when the live user check fails', async () => {
    mockRequireLiveUser.mockRejectedValue(new Error('Authentication required'));

    await expect(requireLiveAdminSession()).resolves.toEqual({
      ok: false,
      status: 401,
      body: { error: 'Unauthorized' },
    });
    expect(mockCreateClient).not.toHaveBeenCalled();
  });

  it('returns 403 when the live user is not an admin', async () => {
    mockRequireLiveUser.mockResolvedValue({ uid: 'user-1' });
    mockCreateClient.mockResolvedValue(profileClient('player') as never);

    await expect(requireLiveAdminSession()).resolves.toEqual({
      ok: false,
      status: 403,
      body: { error: 'Forbidden' },
    });
  });

  it('returns the admin id after a live user check', async () => {
    mockRequireLiveUser.mockResolvedValue({ uid: 'admin-1' });
    mockCreateClient.mockResolvedValue(profileClient('admin') as never);

    await expect(requireLiveAdminSession()).resolves.toEqual({
      ok: true,
      userId: 'admin-1',
    });
  });
});
