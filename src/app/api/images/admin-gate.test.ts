/**
 * API-016 — admin mutations on /api/images must use requireLiveAdminSession.
 */

import { describe, expect, it, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/lib/admin', () => ({
  requireLiveAdminSession: vi.fn(),
}));

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
  createServiceRoleClient: vi.fn(),
}));

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
import { requireLiveAdminSession } from '@/lib/admin';
import { createServiceRoleClient } from '@/lib/supabase/server';

const mockRequireLiveAdminSession = vi.mocked(requireLiveAdminSession);
const mockCreateServiceRoleClient = vi.mocked(createServiceRoleClient);

function makePostRequest() {
  return new NextRequest('http://localhost/api/images', {
    method: 'POST',
    headers: { origin: 'http://localhost' },
  });
}

describe('POST /api/images admin gate (API-016)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('does not open the service-role client when requireLiveAdminSession fails', async () => {
    mockRequireLiveAdminSession.mockResolvedValue({
      ok: false,
      status: 403,
      body: { error: 'Forbidden' },
    });

    const response = await POST(makePostRequest());

    expect(response.status).toBe(403);
    expect(mockRequireLiveAdminSession).toHaveBeenCalledTimes(1);
    expect(mockCreateServiceRoleClient).not.toHaveBeenCalled();
  });
});
