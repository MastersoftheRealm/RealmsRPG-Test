import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

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

vi.mock('@/lib/api-error', async () => {
  const mod = await vi.importActual<typeof import('@/lib/api-error')>('@/lib/api-error');
  return {
    ...mod,
    apiErrorResponse: vi.fn(mod.apiErrorResponse),
  };
});

import { GET } from './route';
import { getSession } from '@/lib/supabase/session';
import { createClient } from '@/lib/supabase/server';
import { apiErrorResponse } from '@/lib/api-error';

const mockGetSession = vi.mocked(getSession);
const mockCreateClient = vi.mocked(createClient);
const mockApiErrorResponse = vi.mocked(apiErrorResponse);

const OWNER = { uid: 'owner-user', email: 'owner@example.com' };
const MEMBER = { uid: 'member-user', email: 'member@example.com' };

type CampaignRow = {
  id: string;
  name: string;
  description: string | null;
  owner_id: string;
  owner_username: string | null;
  invite_code: string;
  characters: unknown;
  created_at: string | null;
  updated_at: string | null;
};

function makeCampaignRow(
  id: string,
  ownerId: string,
  overrides: Partial<CampaignRow> = {},
): CampaignRow {
  return {
    id,
    name: 'Test Campaign',
    description: null,
    owner_id: ownerId,
    owner_username: 'realm_master',
    invite_code: 'SECRET-CODE',
    characters: [],
    created_at: '2026-07-01T12:00:00.000Z',
    updated_at: '2026-07-01T12:00:00.000Z',
    ...overrides,
  };
}

function createMockSupabase(config: {
  memberCampaignIds?: string[] | undefined;
  ownedCampaignIds?: string[] | undefined;
  campaigns?: CampaignRow[] | undefined;
  membersByCampaign?: Record<string, string[]> | undefined;
}) {
  const {
    memberCampaignIds = [],
    ownedCampaignIds = [],
    campaigns = [],
    membersByCampaign = {},
  } = config;

  return {
    from: vi.fn((table: string) => {
      if (table === 'campaign_members') {
        return {
          select: vi.fn((cols?: string) => {
            if (cols === 'campaign_id') {
              return {
                eq: vi.fn().mockResolvedValue({
                  data: memberCampaignIds.map((id) => ({ campaign_id: id })),
                  error: null,
                }),
              };
            }
            return {
              in: vi.fn().mockResolvedValue({
                data: Object.entries(membersByCampaign).flatMap(([campaignId, userIds]) =>
                  userIds.map((user_id) => ({ campaign_id: campaignId, user_id })),
                ),
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
                  data: ownedCampaignIds.map((id) => ({ id })),
                  error: null,
                }),
              };
            }
            return {
              in: vi.fn().mockReturnValue({
                order: vi.fn().mockResolvedValue({ data: campaigns, error: null }),
              }),
            };
          }),
        };
      }
      throw new Error(`Unexpected table: ${table}`);
    }),
  };
}

function makeGetRequest(search = '') {
  return new NextRequest(`http://localhost/api/campaigns${search}`);
}

async function readJson<T>(response: Response): Promise<T> {
  return response.json() as Promise<T>;
}

describe('GET /api/campaigns', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 when session is missing', async () => {
    mockGetSession.mockResolvedValue({ user: null, error: 'No session' });

    const response = await GET(makeGetRequest());

    expect(response.status).toBe(401);
    await expect(readJson(response)).resolves.toEqual({ error: 'Unauthorized' });
  });

  it('returns an empty list when the user has no campaigns', async () => {
    mockGetSession.mockResolvedValue({ user: OWNER, error: null });
    mockCreateClient.mockResolvedValue(
      createMockSupabase({ memberCampaignIds: [], ownedCampaignIds: [] }) as never,
    );

    const response = await GET(makeGetRequest());

    expect(response.status).toBe(200);
    await expect(readJson(response)).resolves.toEqual([]);
  });

  it('returns campaign summaries for owned campaigns with isOwner true', async () => {
    const row = makeCampaignRow('camp-1', OWNER.uid);
    mockGetSession.mockResolvedValue({ user: OWNER, error: null });
    mockCreateClient.mockResolvedValue(
      createMockSupabase({
        memberCampaignIds: [],
        ownedCampaignIds: ['camp-1'],
        campaigns: [row],
        membersByCampaign: { 'camp-1': [OWNER.uid] },
      }) as never,
    );

    const response = await GET(makeGetRequest());

    expect(response.status).toBe(200);
    const body = await readJson<Array<{ id: string; isOwner: boolean }>>(response);
    expect(body).toHaveLength(1);
    expect(body[0]?.id).toBe('camp-1');
    expect(body[0]?.isOwner).toBe(true);
  });

  it('returns 400 for unknown query keys', async () => {
    mockGetSession.mockResolvedValue({ user: OWNER, error: null });

    const response = await GET(
      new NextRequest('http://localhost/api/campaigns?full=true&unknown=1'),
    );

    expect(response.status).toBe(400);
  });

  it('returns 429 when rate limited', async () => {
    const { standardLimiter } = await import('@/lib/rate-limit');
    vi.mocked(standardLimiter.check).mockResolvedValueOnce({
      success: false,
      remaining: 0,
      reset: Date.now() + 60_000,
    });
    mockGetSession.mockResolvedValue({ user: OWNER, error: null });

    const response = await GET(makeGetRequest());

    expect(response.status).toBe(429);
    await expect(readJson(response)).resolves.toEqual({ error: 'Too many requests' });
  });

  it('uses apiErrorResponse for unexpected failures (matches GET /api/campaigns/[id])', async () => {
    mockGetSession.mockResolvedValue({ user: OWNER, error: null });
    mockCreateClient.mockRejectedValue(new Error('database unavailable'));

    const response = await GET(makeGetRequest());

    expect(mockApiErrorResponse).toHaveBeenCalledWith(
      'Failed to load campaigns',
      500,
      'GET /api/campaigns',
      expect.any(Error),
    );
    expect(response.status).toBe(500);
    await expect(readJson(response)).resolves.toEqual({ error: 'Failed to load campaigns' });
  });

  it('returns full Campaign payloads with invite code for the owner', async () => {
    const row = makeCampaignRow('camp-1', OWNER.uid);
    mockGetSession.mockResolvedValue({ user: OWNER, error: null });
    mockCreateClient.mockResolvedValue(
      createMockSupabase({
        memberCampaignIds: [],
        ownedCampaignIds: ['camp-1'],
        campaigns: [row],
        membersByCampaign: { 'camp-1': [OWNER.uid] },
      }) as never,
    );

    const response = await GET(makeGetRequest('?full=true'));

    expect(response.status).toBe(200);
    const body =
      await readJson<Array<{ id: string; inviteCode: string; memberIds: string[] }>>(response);
    expect(body).toHaveLength(1);
    expect(body[0]?.inviteCode).toBe('SECRET-CODE');
    expect(body[0]?.memberIds).toEqual([OWNER.uid]);
  });

  it('returns full Campaign payloads with an empty invite code for a member', async () => {
    const row = makeCampaignRow('camp-shared', OWNER.uid);
    mockGetSession.mockResolvedValue({ user: MEMBER, error: null });
    mockCreateClient.mockResolvedValue(
      createMockSupabase({
        memberCampaignIds: ['camp-shared'],
        ownedCampaignIds: [],
        campaigns: [row],
        membersByCampaign: { 'camp-shared': [OWNER.uid, MEMBER.uid] },
      }) as never,
    );

    const response = await GET(makeGetRequest('?full=true'));

    expect(response.status).toBe(200);
    const body = await readJson<Array<{ id: string; inviteCode: string }>>(response);
    expect(body[0]?.inviteCode).toBe('');
  });
});
