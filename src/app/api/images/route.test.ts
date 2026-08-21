import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/lib/supabase/session', () => ({
  getSession: vi.fn(),
}));

vi.mock('@/lib/admin', () => ({
  isAdmin: vi.fn(),
}));

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
  createServiceRoleClient: vi.fn(),
}));

import { GET, POST } from './route';
import { getSession } from '@/lib/supabase/session';
import { isAdmin } from '@/lib/admin';
import { createClient, createServiceRoleClient } from '@/lib/supabase/server';

const mockGetSession = vi.mocked(getSession);
const mockIsAdmin = vi.mocked(isAdmin);
const mockCreateClient = vi.mocked(createClient);
const mockCreateServiceRoleClient = vi.mocked(createServiceRoleClient);

const USER = { uid: 'user-123', email: 'hero@example.com' };

function createListSupabase() {
  return {
    from: vi.fn((table: string) => {
      if (table !== 'realms_images') throw new Error(`Unexpected table: ${table}`);
      return {
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({ data: [], error: null }),
        }),
      };
    }),
  };
}

function makeGetRequest() {
  return new NextRequest('http://localhost/api/images');
}

function makePostRequest() {
  return new NextRequest('http://localhost/api/images', {
    method: 'POST',
    headers: { origin: 'http://localhost' },
  });
}

async function readJson<T>(response: Response): Promise<T> {
  return response.json() as Promise<T>;
}

describe('GET /api/images', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('lists images without a session (public read)', async () => {
    mockCreateClient.mockResolvedValue(createListSupabase() as never);

    const response = await GET(makeGetRequest());

    expect(response.status).toBe(200);
    await expect(readJson(response)).resolves.toEqual({ images: [] });
    expect(mockGetSession).not.toHaveBeenCalled();
  });
});

describe('POST /api/images', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 when session is missing', async () => {
    mockGetSession.mockResolvedValue({ user: null, error: 'No session' });

    const response = await POST(makePostRequest());

    expect(response.status).toBe(401);
    await expect(readJson(response)).resolves.toEqual({ error: 'Unauthorized' });
    expect(mockCreateServiceRoleClient).not.toHaveBeenCalled();
  });

  it('returns 403 when the user is authenticated but not admin', async () => {
    mockGetSession.mockResolvedValue({ user: USER, error: null });
    mockIsAdmin.mockResolvedValue(false);

    const response = await POST(makePostRequest());

    expect(response.status).toBe(403);
    await expect(readJson(response)).resolves.toEqual({ error: 'Admin access required' });
    expect(mockCreateServiceRoleClient).not.toHaveBeenCalled();
  });
});
