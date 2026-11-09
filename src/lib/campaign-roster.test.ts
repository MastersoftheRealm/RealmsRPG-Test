import { describe, expect, it, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { isUserCampaignParticipant, rowToCampaign } from '@/lib/campaign-roster';
import type { Tables } from '@/lib/supabase/database';

vi.mock('@/lib/supabase/session', () => ({
  getSession: vi.fn(),
}));

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}));

vi.mock('@/lib/rate-limit', () => ({
  buildRateLimitKey: vi.fn(() => 'campaigns-get:test'),
  resolveClientIp: vi.fn(() => '203.0.113.1'),
  standardLimiter: {
    check: vi.fn(() =>
      Promise.resolve({ success: true, remaining: 29, reset: Date.now() + 60_000 }),
    ),
  },
}));

describe('isUserCampaignParticipant', () => {
  it('accepts the campaign owner and listed members', () => {
    expect(isUserCampaignParticipant('owner-1', 'owner-1', [])).toBe(true);
    expect(isUserCampaignParticipant('player-1', 'owner-1', ['player-1', 'other'])).toBe(true);
  });

  it('rejects a stale roster user who is not a member', () => {
    expect(isUserCampaignParticipant('former-player', 'owner-1', ['other'])).toBe(false);
  });
});

function minimalCampaignRow(overrides: Partial<Tables<'campaigns'>> = {}): Tables<'campaigns'> {
  return {
    id: 'camp-1',
    name: 'Test Campaign',
    description: null,
    owner_id: 'owner-1',
    owner_username: 'rm',
    invite_code: 'SECRET-INVITE',
    characters: [],
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-02T00:00:00Z',
    ...overrides,
  };
}

describe('rowToCampaign', () => {
  it('exposes invite code to the campaign owner only', () => {
    const row = minimalCampaignRow();
    const ownerCampaign = rowToCampaign(row, ['owner-1'], true);
    const memberCampaign = rowToCampaign(row, ['owner-1', 'player-1'], false);

    expect(ownerCampaign.inviteCode).toBe('SECRET-INVITE');
    expect(memberCampaign.inviteCode).toBe('');
  });
});

describe('campaign API routes use shared rowToCampaign', () => {
  const OWNER = { uid: 'owner-user', email: 'owner@example.com' };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  it('GET /api/campaigns delegates mapping through campaign-roster', async () => {
    const rowToCampaignSpy = vi.fn();
    vi.doMock('@/lib/campaign-roster', async () => {
      const mod =
        await vi.importActual<typeof import('@/lib/campaign-roster')>('@/lib/campaign-roster');
      return {
        ...mod,
        rowToCampaign: (...args: Parameters<typeof mod.rowToCampaign>) => {
          rowToCampaignSpy(...args);
          return mod.rowToCampaign(...args);
        },
      };
    });

    const { getSession } = await import('@/lib/supabase/session');
    const { createClient } = await import('@/lib/supabase/server');
    vi.mocked(getSession).mockResolvedValue({ user: OWNER, error: null });
    vi.mocked(createClient).mockResolvedValue({
      from: vi.fn((table: string) => {
        if (table === 'campaign_members') {
          return {
            select: vi.fn((cols?: string) => {
              if (cols === 'campaign_id') {
                return {
                  eq: vi.fn().mockResolvedValue({ data: [], error: null }),
                };
              }
              return {
                in: vi.fn().mockResolvedValue({
                  data: [{ campaign_id: 'camp-1', user_id: OWNER.uid }],
                  error: null,
                }),
              };
            }),
          };
        }
        if (table === 'campaigns') {
          return {
            select: vi.fn((cols?: string) => {
              if (cols === 'id') {
                return {
                  eq: vi.fn().mockResolvedValue({
                    data: [{ id: 'camp-1' }],
                    error: null,
                  }),
                };
              }
              return {
                in: vi.fn().mockReturnValue({
                  order: vi.fn().mockResolvedValue({
                    data: [
                      {
                        id: 'camp-1',
                        name: 'Test Campaign',
                        description: null,
                        owner_id: OWNER.uid,
                        owner_username: 'rm',
                        invite_code: 'SECRET-CODE',
                        characters: [],
                        created_at: '2026-07-01T12:00:00.000Z',
                        updated_at: '2026-07-01T12:00:00.000Z',
                      },
                    ],
                    error: null,
                  }),
                }),
              };
            }),
          };
        }
        throw new Error(`Unexpected table: ${table}`);
      }),
    } as never);

    const { GET } = await import('@/app/api/campaigns/route');
    const response = await GET(new NextRequest('http://localhost/api/campaigns?full=true'));

    expect(response.status).toBe(200);
    expect(rowToCampaignSpy).toHaveBeenCalled();
  });

  it('GET /api/campaigns/[id] delegates mapping through campaign-roster', async () => {
    const rowToCampaignSpy = vi.fn();
    vi.doMock('@/lib/campaign-roster', async () => {
      const mod =
        await vi.importActual<typeof import('@/lib/campaign-roster')>('@/lib/campaign-roster');
      return {
        ...mod,
        rowToCampaign: (...args: Parameters<typeof mod.rowToCampaign>) => {
          rowToCampaignSpy(...args);
          return mod.rowToCampaign(...args);
        },
      };
    });

    const { getSession } = await import('@/lib/supabase/session');
    const { createClient } = await import('@/lib/supabase/server');
    vi.mocked(getSession).mockResolvedValue({ user: OWNER, error: null });
    vi.mocked(createClient).mockResolvedValue({
      from: vi.fn((table: string) => {
        if (table === 'campaigns') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({
                  data: {
                    id: 'camp-1',
                    name: 'Test Campaign',
                    description: null,
                    owner_id: OWNER.uid,
                    owner_username: 'rm',
                    invite_code: 'SECRET-CODE',
                    characters: [],
                    created_at: '2026-07-01T12:00:00.000Z',
                    updated_at: '2026-07-01T12:00:00.000Z',
                  },
                  error: null,
                }),
              }),
            }),
          };
        }
        if (table === 'campaign_members') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({
                data: [{ user_id: OWNER.uid }],
                error: null,
              }),
            }),
          };
        }
        throw new Error(`Unexpected table: ${table}`);
      }),
    } as never);

    const { GET } = await import('@/app/api/campaigns/[id]/route');
    const response = await GET(new NextRequest('http://localhost/api/campaigns/camp-1'), {
      params: Promise.resolve({ id: 'camp-1' }),
    });

    expect(response.status).toBe(200);
    expect(rowToCampaignSpy).toHaveBeenCalled();
  });
});
