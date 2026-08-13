import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/supabase/session', () => ({
  getSession: vi.fn(),
}));

import { GET } from './route';
import { getSession } from '@/lib/supabase/session';

const mockGetSession = vi.mocked(getSession);

async function readJson<T>(response: Response): Promise<T> {
  return response.json() as Promise<T>;
}

describe('GET /api/user/enhanced-items', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 when session is missing', async () => {
    mockGetSession.mockResolvedValue({ user: null, error: 'No session' });

    const response = await GET();

    expect(response.status).toBe(401);
    await expect(readJson(response)).resolves.toEqual({ error: 'Unauthorized' });
  });
});
