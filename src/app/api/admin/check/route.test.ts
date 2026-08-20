import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/supabase/session', () => ({
  getSession: vi.fn(),
}));

vi.mock('@/lib/admin', () => ({
  isAdmin: vi.fn(),
}));

import { GET } from './route';
import { getSession } from '@/lib/supabase/session';
import { isAdmin } from '@/lib/admin';

const mockGetSession = vi.mocked(getSession);
const mockIsAdmin = vi.mocked(isAdmin);

const USER = { uid: 'user-123', email: 'hero@example.com' };

async function readJson<T>(response: Response): Promise<T> {
  return response.json() as Promise<T>;
}

describe('GET /api/admin/check', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns isAdmin false when session is missing (not 401)', async () => {
    mockGetSession.mockResolvedValue({ user: null, error: 'No session' });

    const response = await GET();

    expect(response.status).toBe(200);
    await expect(readJson(response)).resolves.toEqual({ isAdmin: false });
    expect(mockIsAdmin).not.toHaveBeenCalled();
  });

  it('returns isAdmin false for an authenticated non-admin', async () => {
    mockGetSession.mockResolvedValue({ user: USER, error: null });
    mockIsAdmin.mockResolvedValue(false);

    const response = await GET();

    expect(response.status).toBe(200);
    await expect(readJson(response)).resolves.toEqual({ isAdmin: false });
    expect(mockIsAdmin).toHaveBeenCalledWith(USER.uid);
  });

  it('returns isAdmin true for an authenticated admin', async () => {
    mockGetSession.mockResolvedValue({ user: USER, error: null });
    mockIsAdmin.mockResolvedValue(true);

    const response = await GET();

    expect(response.status).toBe(200);
    await expect(readJson(response)).resolves.toEqual({ isAdmin: true });
  });
});
