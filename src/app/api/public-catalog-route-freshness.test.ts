import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import * as nextCache from 'next/cache';

vi.mock('@/lib/supabase/session', () => ({
  getSession: vi.fn(),
}));

vi.mock('@/lib/admin', () => ({
  isAdmin: vi.fn(),
  requireLiveAdminSession: vi.fn(),
}));

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
  createServiceRoleClient: vi.fn(),
}));

vi.mock('@/lib/supabase/public-client', () => ({
  createPublicClient: vi.fn(() => null),
}));

vi.mock('@/lib/entity-image-enrich-server', () => ({
  enrichRowsWithBankImageUrls: vi.fn(() => Promise.resolve()),
}));

vi.mock('@/lib/codex-changelog', () => ({
  recordCodexChange: vi.fn(async () => undefined),
}));

vi.mock('@/lib/codex/id-allocation', () => ({
  allocateCodexNumericId: vi.fn(),
  retireCodexId: vi.fn(() => Promise.resolve()),
}));

import { GET, POST } from '@/app/api/official/[type]/route';
import { GET as getCodex } from '@/app/api/codex/route';
import { createPublicClient } from '@/lib/supabase/public-client';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { requireLiveAdminSession } from '@/lib/admin';
import { VERCEL_CACHE_TAG_HEADER } from '@/lib/api/public-cdn-cache';
import {
  codexListedGetCacheTags,
  officialListedGetCacheTags,
} from '@/lib/api/public-catalog-cache-invalidation';
import { codexPublicCollectionCdnCacheTag } from '@/lib/codex/cache-tags';

const mockCreatePublicClient = vi.mocked(createPublicClient);
const mockCreateServiceRoleClient = vi.mocked(createServiceRoleClient);
const mockRequireLiveAdminSession = vi.mocked(requireLiveAdminSession);

const USER = { uid: 'admin-1', email: 'admin@example.com' };

function params(type: string) {
  return { params: Promise.resolve({ type }) };
}

function makeGetRequest(type: string, search = '') {
  return new NextRequest(`http://localhost/api/official/${type}${search}`);
}

describe('public catalog route freshness after writes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(nextCache.revalidateTag).mockClear();
  });

  it('purges listed official powers after POST using GET cache tags', async () => {
    let listName = 'Bolt';

    const listQuery = {
      eq: vi.fn(function eq() {
        return listQuery;
      }),
      then(
        onFulfilled?: (value: { data: unknown[]; error: null }) => unknown,
        onRejected?: (reason: unknown) => unknown,
      ) {
        return Promise.resolve({
          data: [
            {
              id: 'p1',
              name: listName,
              catalog_listing: 'listed',
              payload: {},
              created_at: '2026-01-01T00:00:00Z',
              updated_at: '2026-01-01T00:00:00Z',
            },
          ],
          error: null,
        }).then(onFulfilled, onRejected);
      },
    };

    mockCreatePublicClient.mockImplementation(
      () =>
        ({
          from: vi.fn(() => ({
            select: vi.fn(() => listQuery),
          })),
        }) as never,
    );

    const get1 = await GET(makeGetRequest('powers'), params('powers'));
    expect(get1.status).toBe(200);
    const cacheTagHeader = get1.headers.get(VERCEL_CACHE_TAG_HEADER) ?? '';
    expect(cacheTagHeader.length).toBeGreaterThan(0);
    const getTags = cacheTagHeader.split(',').map((tag) => tag.trim());
    const writeTags = officialListedGetCacheTags('official_powers');
    for (const tag of getTags) {
      expect(writeTags).toContain(tag);
    }
    await expect(get1.json()).resolves.toEqual([
      expect.objectContaining({ id: 'p1', name: 'Bolt' }),
    ]);

    mockRequireLiveAdminSession.mockResolvedValue({ ok: true, userId: USER.uid });
    const insertSingle = vi.fn(async () => ({
      data: { id: 'power-new', name: 'Firebolt', payload: {} },
      error: null,
    }));
    mockCreateServiceRoleClient.mockReturnValue({
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          ilike: vi.fn().mockReturnThis(),
          neq: vi.fn().mockReturnThis(),
          limit: vi.fn().mockReturnThis(),
          maybeSingle: vi.fn(async () => ({ data: null, error: null })),
        })),
        insert: vi.fn(() => ({
          select: vi.fn(() => ({ single: insertSingle })),
        })),
      })),
    } as never);

    const postResponse = await POST(
      new NextRequest('http://localhost/api/official/powers', {
        method: 'POST',
        headers: { 'content-type': 'application/json', origin: 'http://localhost' },
        body: JSON.stringify({ name: 'Firebolt' }),
      }),
      params('powers'),
    );
    expect(postResponse.status).toBe(200);

    for (const tag of getTags) {
      expect(nextCache.revalidateTag).toHaveBeenCalledWith(tag, { expire: 0 });
    }

    listName = 'Bolt v2';
    const get2 = await GET(makeGetRequest('powers'), params('powers'));
    await expect(get2.json()).resolves.toEqual([
      expect.objectContaining({ id: 'p1', name: 'Bolt v2' }),
    ]);
  });

  it('purges listed codex coreRules after tag expire using GET cache tags', async () => {
    let baseHealth = 8;

    mockCreatePublicClient.mockImplementation(
      () =>
        ({
          from: (table: string) => {
            if (table !== 'core_rules') {
              throw new Error(`Unexpected table ${table}`);
            }
            return {
              select: async () => ({
                data: [{ id: 'PROGRESSION_PLAYER', data: { baseHealth } }],
                error: null,
              }),
            };
          },
        }) as never,
    );

    const get1 = await getCodex(new Request('http://localhost/api/codex?collection=coreRules'));
    expect(get1.status).toBe(200);
    const cacheTag = get1.headers.get(VERCEL_CACHE_TAG_HEADER) ?? '';
    expect(cacheTag).toContain(codexPublicCollectionCdnCacheTag('coreRules'));
    await expect(get1.json()).resolves.toMatchObject({
      coreRules: { PROGRESSION_PLAYER: { baseHealth: 8 } },
    });

    baseHealth = 10;
    const listedCodexTags = codexListedGetCacheTags('core_rules');
    expect(cacheTag.split(',')).toContain(codexPublicCollectionCdnCacheTag('coreRules'));
    for (const tag of listedCodexTags) {
      vi.mocked(nextCache.updateTag)(tag);
    }

    const get2 = await getCodex(new Request('http://localhost/api/codex?collection=coreRules'));
    await expect(get2.json()).resolves.toMatchObject({
      coreRules: { PROGRESSION_PLAYER: { baseHealth: 10 } },
    });
  });
});
