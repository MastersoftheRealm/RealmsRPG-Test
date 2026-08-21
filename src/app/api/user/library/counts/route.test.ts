import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/supabase/session', () => ({
  getSession: vi.fn(),
}));

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}));

vi.mock('@/lib/library/fetch-library-tab-counts', () => ({
  fetchLibraryTabCounts: vi.fn(),
  asLibraryCountsClient: (client: unknown) => client,
  USER_LIBRARY_COUNT_TABLES: { powers: 'user_powers' },
}));

import { GET } from './route';
import { getSession } from '@/lib/supabase/session';
import { createClient } from '@/lib/supabase/server';
import { fetchLibraryTabCounts } from '@/lib/library/fetch-library-tab-counts';
import { EMPTY_LIBRARY_TAB_COUNTS } from '@/lib/library/library-tab-counts';

const mockGetSession = vi.mocked(getSession);
const mockCreateClient = vi.mocked(createClient);
const mockFetchCounts = vi.mocked(fetchLibraryTabCounts);

async function readJson<T>(response: Response): Promise<T> {
  return response.json() as Promise<T>;
}

describe('GET /api/user/library/counts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 when session is missing', async () => {
    mockGetSession.mockResolvedValue({ user: null, error: 'No session' });

    const response = await GET();

    expect(response.status).toBe(401);
    await expect(readJson(response)).resolves.toEqual({ error: 'Unauthorized' });
    expect(mockFetchCounts).not.toHaveBeenCalled();
  });

  it('returns aggregated counts for the signed-in user', async () => {
    mockGetSession.mockResolvedValue({
      user: { uid: 'user-1', email: 'a@b.c' },
      error: null,
    });
    mockCreateClient.mockResolvedValue({} as never);
    mockFetchCounts.mockResolvedValue({
      ...EMPTY_LIBRARY_TAB_COUNTS,
      powers: 2,
      weapons: 3,
      enhanced: 1,
    });

    const response = await GET();

    expect(response.status).toBe(200);
    await expect(readJson(response)).resolves.toEqual({
      ...EMPTY_LIBRARY_TAB_COUNTS,
      powers: 2,
      weapons: 3,
      enhanced: 1,
    });
    expect(mockFetchCounts).toHaveBeenCalledWith({}, expect.any(Object), 'user-1');
  });
});
