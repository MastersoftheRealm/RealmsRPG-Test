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
import { CREATOR_NAME_MAX_LENGTH } from '@/lib/creator/creator-text-limits';
import {
  CAMPAIGN_ROLL_TITLE_MAX_LENGTH,
  formatRandomizeRollTitle,
} from '@/lib/rolls/campaign-roll-limits';

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

type RelationalRollRow = {
  id: string;
  character_id: string;
  character_name: string;
  user_id: string;
  type: string;
  title: string;
  rolled_at: string;
  rolled_by_realm_master: boolean;
  modifier: number;
  modifier_label: string | null;
  total: number;
  is_crit: boolean | null;
  is_crit_fail: boolean | null;
  crit_message: string | null;
  campaign_roll_dice: Array<{
    position: number;
    die_type: string;
    value: number;
    is_max: boolean;
    is_min: boolean;
  }>;
};

function createRollsSupabase(opts: {
  campaign: { id: string; owner_id: string; characters?: RosterEntry[] } | null;
  memberUserIds?: string[] | undefined;
  rolls?: RelationalRollRow[] | undefined;
}) {
  const memberUserIds = opts.memberUserIds ?? [];
  const rpc = vi.fn().mockResolvedValue({ data: null, error: null });
  const rollsSelect = vi.fn();

  return {
    rpc,
    rollsSelect,
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
        listChain.limit = vi.fn().mockResolvedValue({ data: opts.rolls ?? [], error: null });
        return {
          select: rollsSelect.mockImplementation(
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
    expect(supabase.rpc).not.toHaveBeenCalled();
  });

  it('returns 400 when Randomize roll title exceeds the API limit', async () => {
    mockGetSession.mockResolvedValue({ user: MEMBER, error: null });
    const supabase = createRollsSupabase({
      campaign: { id: 'camp-1', owner_id: OWNER.uid, characters: MEMBER_ROSTER },
      memberUserIds: [MEMBER.uid],
    });
    mockCreateClient.mockResolvedValue(supabase as never);

    const overlong = `${'x'.repeat(CREATOR_NAME_MAX_LENGTH)}: 1d100 → ${'y'.repeat(CREATOR_NAME_MAX_LENGTH)}z`;
    expect(overlong.length).toBeGreaterThan(CAMPAIGN_ROLL_TITLE_MAX_LENGTH);

    const response = await POST(
      makePostRequest('camp-1', {
        characterId: 'char-member',
        characterName: 'Member Hero',
        roll: {
          type: 'custom',
          title: overlong,
          dice: [{ type: 'd100', value: 42 }],
        },
      }),
      params('camp-1'),
    );

    expect(response.status).toBe(400);
    expect(supabase.rpc).not.toHaveBeenCalled();
  });

  it('saves a Randomize roll whose title was clamped for an oversize variant label', async () => {
    mockGetSession.mockResolvedValue({ user: MEMBER, error: null });
    const supabase = createRollsSupabase({
      campaign: { id: 'camp-1', owner_id: OWNER.uid, characters: MEMBER_ROSTER },
      memberUserIds: [MEMBER.uid],
    });
    mockCreateClient.mockResolvedValue(supabase as never);

    const title = formatRandomizeRollTitle(
      'x'.repeat(CREATOR_NAME_MAX_LENGTH),
      100,
      'y'.repeat(CREATOR_NAME_MAX_LENGTH + 40),
    );
    expect(title.length).toBeLessThanOrEqual(CAMPAIGN_ROLL_TITLE_MAX_LENGTH);

    const response = await POST(
      makePostRequest('camp-1', {
        characterId: 'char-member',
        characterName: 'Member Hero',
        roll: {
          type: 'custom',
          title,
          dice: [{ type: 'd100', value: 12 }],
        },
      }),
      params('camp-1'),
    );

    expect(response.status).toBe(200);
    expect(supabase.rpc).toHaveBeenCalledWith(
      'create_campaign_roll_relational',
      expect.objectContaining({ p_title: title }),
    );
    const saved = supabase.rpc.mock.calls[0]?.[1] as { p_title: string };
    expect(saved.p_title.length).toBeLessThanOrEqual(CAMPAIGN_ROLL_TITLE_MAX_LENGTH);
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
    expect(supabase.rpc).toHaveBeenCalled();
    const saved = supabase.rpc.mock.calls[0]?.[1] as { p_rolled_by_realm_master?: boolean };
    expect(saved.p_rolled_by_realm_master).toBe(false);
  });

  it('records that the Realm Master rolled a player character', async () => {
    mockGetSession.mockResolvedValue({ user: OWNER, error: null });
    const supabase = createRollsSupabase({
      campaign: { id: 'camp-1', owner_id: OWNER.uid, characters: MEMBER_ROSTER },
      memberUserIds: [OWNER.uid, MEMBER.uid],
    });
    mockCreateClient.mockResolvedValue(supabase as never);

    const response = await POST(
      makePostRequest('camp-1', rollBody('char-member', 'Spoofed Name')),
      params('camp-1'),
    );

    expect(response.status).toBe(200);
    const saved = supabase.rpc.mock.calls[0]?.[1] as {
      p_character_name: string;
      p_user_id: string;
      p_rolled_by_realm_master: boolean;
    };
    expect(saved.p_character_name).toBe('Member Hero');
    expect(saved.p_user_id).toBe(OWNER.uid);
    expect(saved.p_rolled_by_realm_master).toBe(true);
  });

  it('recomputes total and crit flags from dice, ignoring client-supplied values (API-012)', async () => {
    mockGetSession.mockResolvedValue({ user: MEMBER, error: null });
    const supabase = createRollsSupabase({
      campaign: { id: 'camp-1', owner_id: OWNER.uid, characters: MEMBER_ROSTER },
      memberUserIds: [MEMBER.uid],
    });
    mockCreateClient.mockResolvedValue(supabase as never);

    const response = await POST(
      makePostRequest('camp-1', {
        characterId: 'char-member',
        characterName: 'Member Hero',
        roll: {
          type: 'skill',
          title: 'Athletics',
          dice: [{ type: 'd20', value: 20, isMax: true, isMin: false }],
          modifier: 5,
          total: 999,
          isCrit: false,
          isCritFail: true,
        },
      }),
      params('camp-1'),
    );

    expect(response.status).toBe(200);
    const saved = supabase.rpc.mock.calls[0]?.[1] as {
      p_total: number;
      p_is_crit: boolean;
      p_is_crit_fail: boolean;
      p_crit_message: string | null;
    };
    expect(saved.p_total).toBe(27);
    expect(saved.p_is_crit).toBe(true);
    expect(saved.p_is_crit_fail).toBe(false);
    expect(saved.p_crit_message).toBe('Natural 20! +2 to the total!');
  });

  it('stores Randomize d20 faces without crit adjustment (API-012)', async () => {
    mockGetSession.mockResolvedValue({ user: MEMBER, error: null });
    const supabase = createRollsSupabase({
      campaign: { id: 'camp-1', owner_id: OWNER.uid, characters: MEMBER_ROSTER },
      memberUserIds: [MEMBER.uid],
    });
    mockCreateClient.mockResolvedValue(supabase as never);

    for (const [face, isCrit, isCritFail] of [
      [20, true, false],
      [1, false, true],
    ] as const) {
      supabase.rpc.mockClear();
      const response = await POST(
        makePostRequest('camp-1', {
          characterId: 'char-member',
          characterName: 'Member Hero',
          roll: {
            type: 'custom',
            title: `Fireball: 1d20 → Face ${face}`,
            dice: [{ type: 'd20', value: face, isMax: !isCritFail, isMin: isCritFail }],
            modifier: 0,
            total: 999,
            isCrit: !isCrit,
          },
        }),
        params('camp-1'),
      );
      expect(response.status).toBe(200);
      const saved = supabase.rpc.mock.calls[0]?.[1] as {
        p_total: number;
        p_is_crit: boolean;
        p_is_crit_fail: boolean;
        p_die_is_max: boolean[];
        p_die_is_min: boolean[];
      };
      expect(saved.p_total).toBe(face);
      expect(saved.p_is_crit).toBe(false);
      expect(saved.p_is_crit_fail).toBe(false);
      expect(saved.p_die_is_max).toEqual([face === 20]);
      expect(saved.p_die_is_min).toEqual([face === 1]);
    }
  });

  it('applies crit adjustment for roll-log dice-pool custom rolls only among custom types', async () => {
    mockGetSession.mockResolvedValue({ user: MEMBER, error: null });
    const supabase = createRollsSupabase({
      campaign: { id: 'camp-1', owner_id: OWNER.uid, characters: MEMBER_ROSTER },
      memberUserIds: [MEMBER.uid],
    });
    mockCreateClient.mockResolvedValue(supabase as never);

    const response = await POST(
      makePostRequest('camp-1', {
        characterId: 'char-member',
        characterName: 'Member Hero',
        roll: {
          type: 'custom',
          title: 'Custom Roll',
          outcomeKind: 'dice-pool',
          dice: [{ type: 'd20', value: 20 }],
          modifier: 0,
        },
      }),
      params('camp-1'),
    );
    expect(response.status).toBe(200);
    const saved = supabase.rpc.mock.calls[0]?.[1] as {
      p_total: number;
      p_is_crit: boolean;
    };
    expect(saved.p_total).toBe(22);
    expect(saved.p_is_crit).toBe(true);
  });

  it('does not mark the Realm Master rolling their own character', async () => {
    mockGetSession.mockResolvedValue({ user: OWNER, error: null });
    const supabase = createRollsSupabase({
      campaign: { id: 'camp-1', owner_id: OWNER.uid, characters: MEMBER_ROSTER },
    });
    mockCreateClient.mockResolvedValue(supabase as never);

    const response = await POST(
      makePostRequest('camp-1', rollBody('char-owner', 'RM Hero')),
      params('camp-1'),
    );

    expect(response.status).toBe(200);
    const saved = supabase.rpc.mock.calls[0]?.[1] as { p_rolled_by_realm_master: boolean };
    expect(saved.p_rolled_by_realm_master).toBe(false);
  });
});

describe('GET /api/campaigns/[id]/rolls attribution', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('assembles ordered relational dice and infers attribution for an older RM roll', async () => {
    mockGetSession.mockResolvedValue({ user: MEMBER, error: null });
    const supabase = createRollsSupabase({
      campaign: { id: 'camp-1', owner_id: OWNER.uid, characters: MEMBER_ROSTER },
      memberUserIds: [MEMBER.uid],
      rolls: [
        {
          id: 'roll-1',
          character_id: 'char-member',
          character_name: 'Member Hero',
          user_id: OWNER.uid,
          type: 'ability',
          title: 'Strength',
          rolled_at: '2026-10-04T00:00:00.000Z',
          rolled_by_realm_master: false,
          modifier: 0,
          modifier_label: null,
          total: 12,
          is_crit: false,
          is_crit_fail: false,
          crit_message: null,
          campaign_roll_dice: [
            {
              position: 2,
              die_type: 'd6',
              value: 3,
              is_max: false,
              is_min: false,
            },
            {
              position: 1,
              die_type: 'd20',
              value: 9,
              is_max: false,
              is_min: false,
            },
          ],
        },
      ],
    });
    mockCreateClient.mockResolvedValue(supabase as never);

    const response = await GET(makeGetRequest('camp-1'), params('camp-1'));
    expect(response.status).toBe(200);
    const body = await readJson<
      Array<{
        characterName: string;
        rolledByRealmMaster?: boolean;
        dice: Array<{ type: string; value: number }>;
      }>
    >(response);
    expect(body).toEqual([
      expect.objectContaining({
        characterName: 'Member Hero',
        rolledByRealmMaster: true,
        dice: [
          expect.objectContaining({ type: 'd20', value: 9 }),
          expect.objectContaining({ type: 'd6', value: 3 }),
        ],
      }),
    ]);

    const selectedColumns = supabase.rollsSelect.mock.calls.find(
      (call) => typeof call[0] === 'string' && call[0].includes('campaign_roll_dice'),
    )?.[0] as string | undefined;
    expect(selectedColumns).toBeDefined();
    expect(selectedColumns).not.toContain('data');
  });
});
