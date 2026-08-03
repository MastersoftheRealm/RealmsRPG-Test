import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/lib/supabase/session', () => ({
  getSession: vi.fn(),
}));

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}));

import { GET } from './route';
import { getSession } from '@/lib/supabase/session';
import { createClient } from '@/lib/supabase/server';

const mockGetSession = vi.mocked(getSession);
const mockCreateClient = vi.mocked(createClient);

const OWNER = { uid: 'owner-user', email: 'owner@example.com' };
const MEMBER = { uid: 'member-user', email: 'member@example.com' };
const OTHER = { uid: 'other-user', email: 'other@example.com' };

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

function makeCampaignRow(id: string, ownerId: string): CampaignRow {
  return {
    id,
    name: 'Test Campaign',
    description: 'A realm',
    owner_id: ownerId,
    owner_username: 'realm_master',
    invite_code: 'SECRET-CODE',
    characters: [],
    created_at: '2026-07-01T12:00:00.000Z',
    updated_at: '2026-07-01T12:00:00.000Z',
  };
}

function createMockSupabase(campaignRow: CampaignRow | null, memberUserIds: string[] = []) {
  return {
    from: vi.fn((table: string) => {
      if (table === 'campaigns') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              maybeSingle: vi.fn().mockResolvedValue({ data: campaignRow, error: null }),
            }),
          }),
        };
      }
      if (table === 'campaign_members') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({
              data: memberUserIds.map((user_id) => ({ user_id })),
              error: null,
            }),
          }),
        };
      }
      throw new Error(`Unexpected table: ${table}`);
    }),
  };
}

function makeGetRequest(id: string) {
  return new NextRequest(`http://localhost/api/campaigns/${id}`);
}

async function readJson<T>(response: Response): Promise<T> {
  return response.json() as Promise<T>;
}

describe('GET /api/campaigns/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 when session is missing', async () => {
    mockGetSession.mockResolvedValue({ user: null, error: 'No session' });

    const response = await GET(makeGetRequest('camp-1'), {
      params: Promise.resolve({ id: 'camp-1' }),
    });

    expect(response.status).toBe(401);
    await expect(readJson(response)).resolves.toEqual({ error: 'Unauthorized' });
  });

  it('returns 404 null for a nonexistent campaign id', async () => {
    mockGetSession.mockResolvedValue({ user: OWNER, error: null });
    mockCreateClient.mockResolvedValue(createMockSupabase(null) as never);

    const response = await GET(makeGetRequest('missing-camp'), {
      params: Promise.resolve({ id: 'missing-camp' }),
    });

    expect(response.status).toBe(404);
    await expect(readJson(response)).resolves.toBeNull();
  });

  it('returns 404 null for a non-member viewer (IDOR — not 403)', async () => {
    const row = makeCampaignRow('camp-private', OWNER.uid);
    mockGetSession.mockResolvedValue({ user: OTHER, error: null });
    mockCreateClient.mockResolvedValue(createMockSupabase(row, [MEMBER.uid]) as never);

    const response = await GET(makeGetRequest('camp-private'), {
      params: Promise.resolve({ id: 'camp-private' }),
    });

    expect(response.status).toBe(404);
    await expect(readJson(response)).resolves.toBeNull();
  });

  it('returns the campaign for the owner with invite code visible', async () => {
    const row = makeCampaignRow('camp-owned', OWNER.uid);
    mockGetSession.mockResolvedValue({ user: OWNER, error: null });
    mockCreateClient.mockResolvedValue(createMockSupabase(row, [OWNER.uid]) as never);

    const response = await GET(makeGetRequest('camp-owned'), {
      params: Promise.resolve({ id: 'camp-owned' }),
    });

    expect(response.status).toBe(200);
    const body = await readJson<{ id: string; inviteCode: string }>(response);
    expect(body.id).toBe('camp-owned');
    expect(body.inviteCode).toBe('SECRET-CODE');
  });

  it('returns the campaign for a member but hides the invite code', async () => {
    const row = makeCampaignRow('camp-member', OWNER.uid);
    mockGetSession.mockResolvedValue({ user: MEMBER, error: null });
    mockCreateClient.mockResolvedValue(createMockSupabase(row, [OWNER.uid, MEMBER.uid]) as never);

    const response = await GET(makeGetRequest('camp-member'), {
      params: Promise.resolve({ id: 'camp-member' }),
    });

    expect(response.status).toBe(200);
    const body = await readJson<{ id: string; inviteCode: string }>(response);
    expect(body.id).toBe('camp-member');
    expect(body.inviteCode).toBe('');
  });
});
