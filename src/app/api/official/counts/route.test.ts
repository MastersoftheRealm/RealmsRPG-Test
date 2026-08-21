import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}));

vi.mock('@/lib/library/fetch-library-tab-counts', () => ({
  fetchLibraryTabCounts: vi.fn(),
  asLibraryCountsClient: (client: unknown) => client,
  OFFICIAL_LIBRARY_COUNT_TABLES: { powers: 'official_powers' },
}));

import { GET } from './route';
import { createClient } from '@/lib/supabase/server';
import { fetchLibraryTabCounts } from '@/lib/library/fetch-library-tab-counts';
import { EMPTY_LIBRARY_TAB_COUNTS } from '@/lib/library/library-tab-counts';

const mockCreateClient = vi.mocked(createClient);
const mockFetchCounts = vi.mocked(fetchLibraryTabCounts);

async function readJson<T>(response: Response): Promise<T> {
  return response.json() as Promise<T>;
}

describe('GET /api/official/counts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns public counts without auth and keeps enhanced at 0', async () => {
    mockCreateClient.mockResolvedValue({} as never);
    mockFetchCounts.mockResolvedValue({
      ...EMPTY_LIBRARY_TAB_COUNTS,
      powers: 12,
      enhanced: 0,
    });

    const response = await GET();

    expect(response.status).toBe(200);
    expect(response.headers.get('Cache-Control')).toBe('private, max-age=0, must-revalidate');
    await expect(readJson(response)).resolves.toEqual({
      ...EMPTY_LIBRARY_TAB_COUNTS,
      powers: 12,
      enhanced: 0,
    });
    expect(mockFetchCounts).toHaveBeenCalledWith({}, expect.any(Object));
  });
});
