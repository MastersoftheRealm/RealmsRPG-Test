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

import { GET as getList } from './route';
import { GET as getDetail } from './[id]/route';
import { getSession } from '@/lib/supabase/session';
import { createClient } from '@/lib/supabase/server';
import type { Campaign } from '@/types/campaign';

const mockGetSession = vi.mocked(getSession);
const mockCreateClient = vi.mocked(createClient);

const OWNER = { uid: 'owner-user', email: 'owner@example.com' };
const MEMBER = { uid: 'member-user', email: 'member@example.com' };

const CAMPAIGN_ROW = {
  id: 'camp-parity',
  name: 'Parity Campaign',
  description: 'A realm',
  owner_id: OWNER.uid,
  owner_username: 'realm_master',
  invite_code: 'SECRET-CODE',
  characters: [{ user_id: OWNER.uid, character_id: 'char-1', character_name: 'Hero', level: 3 }],
  created_at: '2026-07-01T12:00:00.000Z',
  updated_at: '2026-07-02T12:00:00.000Z',
};

function listSupabaseMock() {
  return {
    from: vi.fn((table: string) => {
      if (table === 'campaign_members') {
        return {
          select: vi.fn((cols?: string) => {
            if (cols === 'campaign_id') {
              return {
                eq: vi.fn().mockResolvedValue({
                  data: [{ campaign_id: CAMPAIGN_ROW.id }],
                  error: null,
                }),
              };
            }
            return {
              in: vi.fn().mockResolvedValue({
                data: [
                  { campaign_id: CAMPAIGN_ROW.id, user_id: OWNER.uid },
                  { campaign_id: CAMPAIGN_ROW.id, user_id: MEMBER.uid },
                ],
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
                eq: vi.fn().mockResolvedValue({ data: [], error: null }),
              };
            }
            return {
              in: vi.fn().mockReturnValue({
                order: vi.fn().mockResolvedValue({ data: [CAMPAIGN_ROW], error: null }),
              }),
            };
          }),
        };
      }
      throw new Error(`Unexpected table: ${table}`);
    }),
  };
}

function detailSupabaseMock() {
  return {
    from: vi.fn((table: string) => {
      if (table === 'campaigns') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              maybeSingle: vi.fn().mockResolvedValue({ data: CAMPAIGN_ROW, error: null }),
            }),
          }),
        };
      }
      if (table === 'campaign_members') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({
              data: [{ user_id: OWNER.uid }, { user_id: MEMBER.uid }],
              error: null,
            }),
          }),
        };
      }
      throw new Error(`Unexpected table: ${table}`);
    }),
  };
}

describe('GET /api/campaigns list (?full=true) vs GET /api/campaigns/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns the same Campaign shape for a member (invite code hidden)', async () => {
    mockGetSession.mockResolvedValue({ user: MEMBER, error: null });

    mockCreateClient.mockResolvedValueOnce(listSupabaseMock() as never);
    const listResponse = await getList(new NextRequest('http://localhost/api/campaigns?full=true'));
    const listBody = (await listResponse.json()) as Campaign[];

    mockCreateClient.mockResolvedValueOnce(detailSupabaseMock() as never);
    const detailResponse = await getDetail(
      new NextRequest(`http://localhost/api/campaigns/${CAMPAIGN_ROW.id}`),
      { params: Promise.resolve({ id: CAMPAIGN_ROW.id }) },
    );
    const detailBody = (await detailResponse.json()) as Campaign;

    expect(listResponse.status).toBe(200);
    expect(detailResponse.status).toBe(200);
    expect(listBody).toHaveLength(1);
    expect(listBody[0]).toEqual(detailBody);
    expect(detailBody.inviteCode).toBe('');
  });

  it('returns the same Campaign shape for the owner (invite code visible)', async () => {
    mockGetSession.mockResolvedValue({ user: OWNER, error: null });

    mockCreateClient.mockResolvedValueOnce({
      from: vi.fn((table: string) => {
        if (table === 'campaign_members') {
          return {
            select: vi.fn((cols?: string) => {
              if (cols === 'campaign_id') {
                return { eq: vi.fn().mockResolvedValue({ data: [], error: null }) };
              }
              return {
                in: vi.fn().mockResolvedValue({
                  data: [{ campaign_id: CAMPAIGN_ROW.id, user_id: OWNER.uid }],
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
                  eq: vi.fn().mockResolvedValue({ data: [{ id: CAMPAIGN_ROW.id }], error: null }),
                };
              }
              return {
                in: vi.fn().mockReturnValue({
                  order: vi.fn().mockResolvedValue({ data: [CAMPAIGN_ROW], error: null }),
                }),
              };
            }),
          };
        }
        throw new Error(`Unexpected table: ${table}`);
      }),
    } as never);
    const listResponse = await getList(new NextRequest('http://localhost/api/campaigns?full=true'));
    const listBody = (await listResponse.json()) as Campaign[];

    mockCreateClient.mockResolvedValueOnce({
      from: vi.fn((table: string) => {
        if (table === 'campaigns') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({ data: CAMPAIGN_ROW, error: null }),
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
    const detailResponse = await getDetail(
      new NextRequest(`http://localhost/api/campaigns/${CAMPAIGN_ROW.id}`),
      { params: Promise.resolve({ id: CAMPAIGN_ROW.id }) },
    );
    const detailBody = (await detailResponse.json()) as Campaign;

    expect(listBody[0]).toEqual(detailBody);
    expect(detailBody.inviteCode).toBe('SECRET-CODE');
  });
});
