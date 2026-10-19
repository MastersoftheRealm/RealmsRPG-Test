import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/lib/admin', () => ({
  requireAdminSession: vi.fn(),
}));

vi.mock('@/lib/supabase/server', () => ({
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

import { GET } from './route';
import { requireAdminSession } from '@/lib/admin';
import { readCodexChangelogEntityName } from '@/lib/codex-changelog-display';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { standardLimiter } from '@/lib/rate-limit';

const mockRequireAdminSession = vi.mocked(requireAdminSession);
const mockCreateServiceRoleClient = vi.mocked(createServiceRoleClient);
const mockStandardLimiterCheck = vi.mocked(standardLimiter.check);

const ADMIN_ID = 'admin-user-123';

function createMockServiceClient() {
  return {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue({ data: [], error: null }),
          }),
        }),
      }),
    })),
  };
}

function makeGetRequest() {
  return new NextRequest('http://localhost/api/admin/changelogs', {
    headers: { 'x-forwarded-for': '203.0.113.1' },
  });
}

async function readJson<T>(response: Response): Promise<T> {
  return response.json() as Promise<T>;
}

type ChangelogFixture = {
  id: string;
  entity_type: string;
  entity_id: string;
  operation: 'create' | 'update' | 'delete';
  changed_at: string;
  changed_by_user_id: string;
  before_data: Record<string, unknown> | null;
  after_data: Record<string, unknown> | null;
  changed_fields: Array<Record<string, unknown>> | null;
};

function changelogFixture(overrides: Partial<ChangelogFixture> = {}): ChangelogFixture {
  return {
    id: 'log-1',
    entity_type: 'codex_feats',
    entity_id: '914',
    operation: 'update',
    changed_at: '2026-10-18T00:00:00.000Z',
    changed_by_user_id: ADMIN_ID,
    before_data: { sources: ['QA Rename Pack One'] },
    after_data: { sources: ['qa rename pack two'] },
    changed_fields: [
      {
        field: 'sources',
        before: ['QA Rename Pack One'],
        after: ['qa rename pack two'],
      },
    ],
    ...overrides,
  };
}

function createRoutingClient(options: {
  rows: ChangelogFixture[];
  entities?: Array<{ id: string; name: string | null }>;
  nameError?: { message: string } | null;
  onNameLookup?: (ids: string[]) => void;
  onFrom?: (table: string) => void;
}) {
  return {
    from: (table: string) => {
      options.onFrom?.(table);
      if (table === 'codex_change_logs') {
        return {
          select: () => ({
            eq: () => ({
              order: () => ({
                limit: () => Promise.resolve({ data: options.rows, error: null }),
              }),
            }),
          }),
        };
      }
      if (table === 'user_profiles') {
        return {
          select: () => ({
            in: () => Promise.resolve({ data: [], error: null }),
          }),
        };
      }
      return {
        select: () => ({
          in: (_column: string, ids: string[]) => {
            options.onNameLookup?.(ids);
            if (options.nameError) {
              return Promise.resolve({ data: null, error: options.nameError });
            }
            const allowed = new Set(ids);
            return Promise.resolve({
              data: (options.entities ?? []).filter((row) => allowed.has(row.id)),
              error: null,
            });
          },
        }),
      };
    },
  };
}

describe('GET /api/admin/changelogs', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockStandardLimiterCheck.mockResolvedValue({
      success: true,
      remaining: 29,
      reset: Date.now() + 60_000,
    });
  });

  it('returns 401 when session is missing', async () => {
    mockRequireAdminSession.mockResolvedValue({
      ok: false,
      status: 401,
      body: { error: 'Unauthorized' },
    });

    const response = await GET(makeGetRequest());

    expect(response.status).toBe(401);
    await expect(readJson(response)).resolves.toEqual({ error: 'Unauthorized' });
    expect(mockCreateServiceRoleClient).not.toHaveBeenCalled();
  });

  it('returns 403 when the user is authenticated but not admin', async () => {
    mockRequireAdminSession.mockResolvedValue({
      ok: false,
      status: 403,
      body: { error: 'Forbidden' },
    });

    const response = await GET(makeGetRequest());

    expect(response.status).toBe(403);
    await expect(readJson(response)).resolves.toEqual({ error: 'Forbidden' });
    expect(mockCreateServiceRoleClient).not.toHaveBeenCalled();
  });

  it('returns changelogs for an authenticated admin', async () => {
    mockRequireAdminSession.mockResolvedValue({ ok: true, userId: ADMIN_ID });
    mockCreateServiceRoleClient.mockReturnValue(createMockServiceClient() as never);

    const response = await GET(makeGetRequest());

    expect(response.status).toBe(200);
    await expect(readJson(response)).resolves.toEqual([]);
  });

  it('titles a sources-only row from the live entity and keeps a stored name', async () => {
    mockRequireAdminSession.mockResolvedValue({ ok: true, userId: ADMIN_ID });
    const lookedUp: string[] = [];
    mockCreateServiceRoleClient.mockReturnValue(
      createRoutingClient({
        rows: [
          changelogFixture(),
          changelogFixture({
            id: 'log-2',
            entity_id: '22',
            before_data: { name: 'Stored Name', sources: ['Core'] },
            after_data: { name: 'Stored Name', sources: ['Official'] },
          }),
          changelogFixture({ id: 'log-3', entity_id: '23' }),
        ],
        entities: [
          { id: '914', name: ' Shield Bash ' },
          { id: '22', name: 'Should Not Replace' },
        ],
        onNameLookup: (ids) => lookedUp.push(...ids),
      }) as never,
    );

    const response = await GET(makeGetRequest());
    const body = await readJson<
      Array<{
        id: string;
        before_data: Record<string, unknown> | null;
        after_data: Record<string, unknown> | null;
      }>
    >(response);

    expect(response.status).toBe(200);
    expect(lookedUp.sort()).toEqual(['23', '914']);
    const sourcesOnly = body.find((row) => row.id === 'log-1');
    const stored = body.find((row) => row.id === 'log-2');
    const missing = body.find((row) => row.id === 'log-3');
    expect(sourcesOnly?.after_data).toEqual({ name: 'Shield Bash' });
    expect(sourcesOnly?.before_data).toEqual({});
    expect(readCodexChangelogEntityName(sourcesOnly?.before_data, sourcesOnly?.after_data)).toBe(
      'Shield Bash',
    );
    expect(stored?.after_data).toEqual({ name: 'Stored Name' });
    expect(readCodexChangelogEntityName(stored?.before_data, stored?.after_data)).toBe(
      'Stored Name',
    );
    expect(missing?.after_data).toEqual({});
    expect(readCodexChangelogEntityName(missing?.before_data, missing?.after_data)).toBe(
      '(unnamed)',
    );
  });

  it('returns the changelog list when the live name lookup fails', async () => {
    mockRequireAdminSession.mockResolvedValue({ ok: true, userId: ADMIN_ID });
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    mockCreateServiceRoleClient.mockReturnValue(
      createRoutingClient({
        rows: [changelogFixture()],
        nameError: { message: 'name column unavailable' },
      }) as never,
    );

    const response = await GET(makeGetRequest());
    const body = await readJson<Array<{ after_data: Record<string, unknown> | null }>>(response);

    expect(response.status).toBe(200);
    expect(body[0]?.after_data).toEqual({});
    errorSpy.mockRestore();
  });

  it('does not query core_rules for a name column', async () => {
    mockRequireAdminSession.mockResolvedValue({ ok: true, userId: ADMIN_ID });
    const tables: string[] = [];
    mockCreateServiceRoleClient.mockReturnValue(
      createRoutingClient({
        rows: [
          changelogFixture({
            entity_type: 'core_rules',
            entity_id: 'rule-1',
            before_data: { data: { text: 'before' } },
            after_data: { data: { text: 'after' } },
          }),
        ],
        onFrom: (table) => tables.push(table),
      }) as never,
    );

    const request = new NextRequest('http://localhost/api/admin/changelogs?entityType=core_rules', {
      headers: { 'x-forwarded-for': '203.0.113.1' },
    });
    const response = await GET(request);
    const body = await readJson<Array<{ after_data: Record<string, unknown> | null }>>(response);

    expect(response.status).toBe(200);
    expect(tables).toEqual(['codex_change_logs', 'user_profiles']);
    expect(body[0]?.after_data).toEqual({});
  });
});
