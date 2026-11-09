import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}));

vi.mock('@/lib/supabase/public-client', () => ({
  createPublicClient: vi.fn(() => null),
}));

vi.mock('@/lib/supabase/session', () => ({
  getSession: vi.fn(),
}));

vi.mock('@/lib/admin', () => ({
  isAdmin: vi.fn(),
}));

import { GET } from './route';
import { createClient } from '@/lib/supabase/server';
import { getSession } from '@/lib/supabase/session';
import { isAdmin } from '@/lib/admin';

const mockCreateClient = vi.mocked(createClient);
const mockGetSession = vi.mocked(getSession);
const mockIsAdmin = vi.mocked(isAdmin);

describe('GET /api/codex admin coreRules (uncached)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('loads core_rules from Supabase on every admin includeUnlisted read', async () => {
    let selectCalls = 0;
    mockGetSession.mockResolvedValue({
      user: { uid: 'admin-1', email: 'admin@example.com' },
      error: null,
    });
    mockIsAdmin.mockResolvedValue(true);
    mockCreateClient.mockResolvedValue({
      from: (table: string) => {
        if (table !== 'core_rules') {
          throw new Error(`Unexpected table ${table}`);
        }
        return {
          select: async () => {
            selectCalls += 1;
            return {
              data: [{ id: 'PROGRESSION_PLAYER', data: { baseHealth: selectCalls } }],
              error: null,
            };
          },
        };
      },
    } as never);

    const url = 'http://localhost/api/codex?collection=coreRules&includeUnlisted=1';
    const first = await GET(new Request(url));
    const second = await GET(new Request(url));

    expect(first.status).toBe(200);
    expect(second.status).toBe(200);
    expect(selectCalls).toBe(2);
    const body1 = (await first.json()) as {
      coreRules?: { PROGRESSION_PLAYER?: { baseHealth?: number } };
    };
    const body2 = (await second.json()) as {
      coreRules?: { PROGRESSION_PLAYER?: { baseHealth?: number } };
    };
    expect(body1.coreRules?.PROGRESSION_PLAYER?.baseHealth).toBe(1);
    expect(body2.coreRules?.PROGRESSION_PLAYER?.baseHealth).toBe(2);
  });
});
