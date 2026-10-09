import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/lib/supabase/session', () => ({
  getSession: vi.fn(),
}));

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}));

vi.mock('@/lib/entity-image-enrich-server', () => ({
  enrichRowsWithBankImageUrls: vi.fn(() => Promise.resolve()),
}));

import { GET } from './route';
import { getSession } from '@/lib/supabase/session';
import { createClient } from '@/lib/supabase/server';

const mockGetSession = vi.mocked(getSession);
const mockCreateClient = vi.mocked(createClient);

async function readJson<T>(response: Response): Promise<T> {
  return response.json() as Promise<T>;
}

describe('GET /api/user/library/[type]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 when session is missing', async () => {
    mockGetSession.mockResolvedValue({ user: null, error: 'No session' });

    const response = await GET(new NextRequest('http://localhost/api/user/library/powers'), {
      params: Promise.resolve({ type: 'powers' }),
    });

    expect(response.status).toBe(401);
    await expect(readJson(response)).resolves.toEqual({ error: 'Unauthorized' });
  });

  it('species name lookup reads the name column and does not select dropped data', async () => {
    mockGetSession.mockResolvedValue({
      user: { uid: 'user-1', email: 'user@example.com' },
      error: null,
    });

    const select = vi.fn((columns: string) => {
      const chain = {
        eq: vi.fn(async () => {
          // Repro: user_species no longer has a `data` column. Requesting it
          // is the 500 that species save shows as "Failed to load library items".
          if (/(^|,)\s*data\s*(,|$)/.test(columns)) {
            return {
              data: null,
              error: { message: 'column user_species.data does not exist', code: '42703' },
            };
          }
          return {
            data: [
              { id: 'sp-1', name: 'Other' },
              { id: 'sp-2', name: 'Riverfolk' },
            ],
            error: null,
          };
        }),
      };
      return chain;
    });

    mockCreateClient.mockResolvedValue({
      from: vi.fn((table: string) => {
        if (table !== 'user_species') throw new Error(`Unexpected table: ${table}`);
        return { select };
      }),
    } as never);

    const response = await GET(
      new NextRequest('http://localhost/api/user/library/species?name=Riverfolk'),
      { params: Promise.resolve({ type: 'species' }) },
    );

    expect(select).toHaveBeenCalledWith('id, name');
    expect(response.status).toBe(200);
    await expect(readJson(response)).resolves.toEqual([{ id: 'sp-2', name: 'Riverfolk' }]);
  });
});
