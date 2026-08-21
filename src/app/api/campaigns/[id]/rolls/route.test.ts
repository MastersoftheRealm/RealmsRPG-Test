import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/lib/supabase/session', () => ({
  getSession: vi.fn(),
}));

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
  createServiceRoleClient: vi.fn(),
}));

vi.mock('@/lib/rate-limit', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/rate-limit')>();
  return {
    ...actual,
    standardLimiter: {
      check: vi.fn(() =>
        Promise.resolve({ success: true, remaining: 29, reset: Date.now() + 60_000 }),
      ),
    },
  };
});

import { GET, POST } from './route';
import { getSession } from '@/lib/supabase/session';
import { createClient, createServiceRoleClient } from '@/lib/supabase/server';
import { standardLimiter } from '@/lib/rate-limit';

const mockGetSession = vi.mocked(getSession);
const mockCreateClient = vi.mocked(createClient);
const mockCreateServiceRoleClient = vi.mocked(createServiceRoleClient);
const mockStandardLimiterCheck = vi.mocked(standardLimiter.check);

const OWNER = { uid: 'owner-user', email: 'owner@example.com' };
const MEMBER = { uid: 'member-user', email: 'member@example.com' };
const OTHER = { uid: 'other-user', email: 'other@example.com' };

type RosterEntry = {
  userId: string;
  characterId: string;
  characterName: string;
};

function createRollsSupabase(opts: {
  campaign: { id: string; owner_id: string; characters?: RosterEntry[] } | null;
  memberUserIds?: string[] | undefined;
}) {
  const memberUserIds = opts.memberUserIds ?? [];
  const insert = vi.fn().mockResolvedValue({ error: null });

  return {
    insert,
    from: vi.fn((table: string) => {
      if (table === 'campaigns') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              maybeSingle: vi.fn().mockResolvedValue({ data: opts.campaign, error: null }),
            }),
          }),
        };
      }
      if (table === 'campaign_members') {
        const eqCalls: [string, string][] = [];
        const chain = {
          eq: vi.fn((col: string, val: string) => {
            eqCalls.push([col, val]);
            return chain;
          }),
          maybeSingle: vi.fn(async () => {
            const filters = Object.fromEntries(eqCalls);
            const uid = filters.user_id;
            const data = uid && memberUserIds.includes(uid) ? { user_id: uid } : null;
            return { data, error: null };
          }),
        };
        return { select: vi.fn().mockReturnValue(chain) };
      }
      if (table === 'campaign_rolls') {
        const listChain: Record<string, unknown> = {};
        listChain.eq = vi.fn().mockReturnValue(listChain);
        listChain.order = vi.fn().mockReturnValue(listChain);
        listChain.limit = vi.fn().mockResolvedValue({ data: [], error: null });
        return {
          select: vi.fn(
            (
              _cols?: string,
              countOpts?: { count?: string | undefined; head?: boolean | undefined },
            ) => {
              if (countOpts?.head) {
                return {
                  eq: vi.fn().mockResolvedValue({ count: 0, error: null }),
                };
              }
              return listChain;
            },
          ),
          insert,
        };
      }
      throw new Error(`Unexpected table: ${table}`);
    }),
  };
}

function makeGetRequest(id: string) {
  return new NextRequest(`http://localhost/api/campaigns/${id}/rolls`);
}

function makePostRequest(id: string, body: Record<string, unknown>) {
  return new NextRequest(`http://localhost/api/campaigns/${id}/rolls`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      origin: 'http://localhost',
      'x-forwarded-for': '203.0.113.1',
    },
    body: JSON.stringify(body),
  });
}

const rollBody = (characterId: string, characterName = 'Hero') => ({
  characterId,
  characterName,
  roll: { type: 'skill', title: 'Athletics' },
});

async function readJson<T>(response: Response): Promise<T> {
  return response.json() as Promise<T>;
}

const params = (id: string) => ({ params: Promise.resolve({ id }) });

const MEMBER_ROSTER: RosterEntry[] = [
  { userId: MEMBER.uid, characterId: 'char-member', characterName: 'Member Hero' },
  { userId: OWNER.uid, characterId: 'char-owner', characterName: 'RM Hero' },
];

describe('GET /api/campaigns/[id]/rolls', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 when session is missing', async () => {
    mockGetSession.mockResolvedValue({ user: null, error: 'No session' });

    const response = await GET(makeGetRequest('camp-1'), params('camp-1'));

    expect(response.status).toBe(401);
    await expect(readJson(response)).resolves.toEqual({ error: 'Unauthorized' });
  });

  it('returns 403 when a non-member requests rolls (IDOR)', async () => {
    mockGetSession.mockResolvedValue({ user: OTHER, error: null });
    mockCreateClient.mockResolvedValue(
      createRollsSupabase({
        campaign: { id: 'camp-1', owner_id: OWNER.uid },
        memberUserIds: [MEMBER.uid],
      }) as never,
    );

    const response = await GET(makeGetRequest('camp-1'), params('camp-1'));

    expect(response.status).toBe(403);
    await expect(readJson(response)).resolves.toEqual({ error: 'Not a campaign member' });
  });

  it('returns rolls for a campaign member', async () => {
    mockGetSession.mockResolvedValue({ user: MEMBER, error: null });
    mockCreateClient.mockResolvedValue(
      createRollsSupabase({
        campaign: { id: 'camp-1', owner_id: OWNER.uid },
        memberUserIds: [MEMBER.uid],
      }) as never,
    );

    const response = await GET(makeGetRequest('camp-1'), params('camp-1'));

    expect(response.status).toBe(200);
    await expect(readJson(response)).resolves.toEqual([]);
  });
});

describe('POST /api/campaigns/[id]/rolls', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockStandardLimiterCheck.mockResolvedValue({
      success: true,
      remaining: 29,
      reset: Date.now() + 60_000,
    });
  });

  it('returns 401 when session is missing', async () => {
    mockGetSession.mockResolvedValue({ user: null, error: 'No session' });

    const response = await POST(
      makePostRequest('camp-1', rollBody('char-member')),
      params('camp-1'),
    );

    expect(response.status).toBe(401);
    await expect(readJson(response)).resolves.toEqual({ error: 'Unauthorized' });
  });

  it('returns 403 when a non-member posts a roll (IDOR)', async () => {
    mockGetSession.mockResolvedValue({ user: OTHER, error: null });
    mockCreateClient.mockResolvedValue(
      createRollsSupabase({
        campaign: { id: 'camp-1', owner_id: OWNER.uid, characters: MEMBER_ROSTER },
        memberUserIds: [MEMBER.uid],
      }) as never,
    );

    const response = await POST(
      makePostRequest('camp-1', rollBody('char-member')),
      params('camp-1'),
    );

    expect(response.status).toBe(403);
    await expect(readJson(response)).resolves.toEqual({ error: 'Not a campaign member' });
    expect(mockCreateServiceRoleClient).not.toHaveBeenCalled();
  });

  it('returns 403 when a member spoofs a roll as another roster character', async () => {
    mockGetSession.mockResolvedValue({ user: MEMBER, error: null });
    const supabase = createRollsSupabase({
      campaign: { id: 'camp-1', owner_id: OWNER.uid, characters: MEMBER_ROSTER },
      memberUserIds: [MEMBER.uid],
    });
    mockCreateClient.mockResolvedValue(supabase as never);

    const response = await POST(
      makePostRequest('camp-1', rollBody('char-owner')),
      params('camp-1'),
    );

    expect(response.status).toBe(403);
    await expect(readJson(response)).resolves.toEqual({
      error: 'You can only roll for your own character in this campaign.',
    });
    expect(supabase.insert).not.toHaveBeenCalled();
  });

  it('saves a roll attributed to the member own roster character', async () => {
    mockGetSession.mockResolvedValue({ user: MEMBER, error: null });
    const supabase = createRollsSupabase({
      campaign: { id: 'camp-1', owner_id: OWNER.uid, characters: MEMBER_ROSTER },
      memberUserIds: [MEMBER.uid],
    });
    mockCreateClient.mockResolvedValue(supabase as never);

    const response = await POST(
      makePostRequest('camp-1', rollBody('char-member', 'Member Hero')),
      params('camp-1'),
    );

    expect(response.status).toBe(200);
    await expect(readJson(response)).resolves.toEqual({ success: true });
    expect(supabase.insert).toHaveBeenCalled();
  });
});
