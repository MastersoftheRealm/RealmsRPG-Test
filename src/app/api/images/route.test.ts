import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/lib/supabase/session', () => ({
  requireLiveUser: vi.fn(),
}));

vi.mock('@/lib/admin', () => ({
  isAdmin: vi.fn(),
}));

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
  createServiceRoleClient: vi.fn(),
}));

import { REALMS_IMAGES_LIST_LIMIT } from '@/lib/realms-images';
import { encodeRealmsImagesListCursor } from '@/lib/realms-images-list-cursor';
import { GET, POST } from './route';
import { requireLiveUser } from '@/lib/supabase/session';
import { isAdmin } from '@/lib/admin';
import { createClient, createServiceRoleClient } from '@/lib/supabase/server';

const mockRequireLiveUser = vi.mocked(requireLiveUser);
const mockIsAdmin = vi.mocked(isAdmin);
const mockCreateClient = vi.mocked(createClient);
const mockCreateServiceRoleClient = vi.mocked(createServiceRoleClient);

const USER = { uid: 'user-123', email: 'hero@example.com' };

type Row = { id: string; name: string };

function sortImageRows(rows: Row[]): Row[] {
  return [...rows].sort((a, b) => {
    const byName = a.name.localeCompare(b.name);
    return byName !== 0 ? byName : a.id.localeCompare(b.id);
  });
}

function createListSupabase(options?: {
  ilike?: ReturnType<typeof vi.fn>;
  range?: ReturnType<typeof vi.fn>;
  sortedRows?: Row[];
}) {
  const sortedRows = options?.sortedRows ?? [];
  const defaultRange = vi.fn((from: number, to: number) => {
    const slice = sortImageRows(sortedRows).slice(from, to + 1);
    const payload = { data: slice, error: null };
    return {
      then: (
        onFulfilled: (value: typeof payload) => unknown,
        onRejected?: (reason: unknown) => unknown,
      ) => Promise.resolve(payload).then(onFulfilled, onRejected),
    };
  });
  const range = options?.range ?? defaultRange;
  const ilike = options?.ilike ?? vi.fn().mockReturnValue({ range });
  const orderById = vi.fn().mockReturnValue({ ilike, range });
  const orderByName = vi.fn().mockReturnValue({ order: orderById, ilike, range });

  return {
    from: vi.fn((table: string) => {
      if (table !== 'realms_images') throw new Error(`Unexpected table: ${table}`);
      return {
        select: vi.fn().mockReturnValue({
          order: orderByName,
        }),
      };
    }),
    ilike,
    range,
    orderByName,
    orderById,
  };
}

function makeGetRequest(search = '') {
  return new NextRequest(`http://localhost/api/images${search}`);
}

function makePostRequest() {
  return new NextRequest('http://localhost/api/images', {
    method: 'POST',
    headers: { origin: 'http://localhost' },
  });
}

async function readJson<T>(response: Response): Promise<T> {
  return response.json() as Promise<T>;
}

describe('GET /api/images', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('lists images without a session (public read)', async () => {
    const chain = createListSupabase();
    mockCreateClient.mockResolvedValue(chain as never);

    const response = await GET(makeGetRequest());

    expect(response.status).toBe(200);
    await expect(readJson(response)).resolves.toEqual({
      images: [],
      hasMore: false,
      nextCursor: null,
    });
    expect(chain.orderByName).toHaveBeenCalledWith('name', { ascending: true });
    expect(chain.orderById).toHaveBeenCalledWith('id', { ascending: true });
    expect(chain.range).toHaveBeenCalledWith(0, REALMS_IMAGES_LIST_LIMIT);
    expect(mockRequireLiveUser).not.toHaveBeenCalled();
  });

  it('returns hasMore and nextCursor when another page exists', async () => {
    const range = vi.fn().mockResolvedValue({
      data: Array.from({ length: REALMS_IMAGES_LIST_LIMIT + 1 }, (_, i) => ({
        id: `img-${i}`,
        name: `Name ${i}`,
      })),
      error: null,
    });
    const chain = createListSupabase({ range });
    mockCreateClient.mockResolvedValue(chain as never);

    const response = await GET(makeGetRequest());
    const body = await readJson<{
      images: unknown[];
      hasMore: boolean;
      nextCursor: string | null;
    }>(response);

    expect(response.status).toBe(200);
    expect(body.images).toHaveLength(REALMS_IMAGES_LIST_LIMIT);
    expect(body.hasMore).toBe(true);
    expect(body.nextCursor).toBe(encodeRealmsImagesListCursor(REALMS_IMAGES_LIST_LIMIT));
  });

  it('pages through duplicate names with a stable id tie-break across three pages', async () => {
    const total = REALMS_IMAGES_LIST_LIMIT * 2 + 5;
    const sortedRows = Array.from({ length: total }, (_, i) => ({
      id: `dup-${String(i).padStart(5, '0')}`,
      name: 'Shared label',
    }));
    const chain = createListSupabase({ sortedRows });
    mockCreateClient.mockResolvedValue(chain as never);

    const first = await readJson<{
      images: Array<{ id: string }>;
      hasMore: boolean;
      nextCursor: string | null;
    }>(await GET(makeGetRequest()));
    expect(first.hasMore).toBe(true);
    expect(first.images).toHaveLength(REALMS_IMAGES_LIST_LIMIT);
    expect(first.images[0]?.id).toBe('dup-00000');
    expect(first.images.at(-1)?.id).toBe(
      `dup-${String(REALMS_IMAGES_LIST_LIMIT - 1).padStart(5, '0')}`,
    );

    const second = await readJson<{
      images: Array<{ id: string }>;
      hasMore: boolean;
      nextCursor: string | null;
    }>(await GET(makeGetRequest(`?cursor=${encodeURIComponent(first.nextCursor ?? '')}`)));
    expect(second.hasMore).toBe(true);
    expect(second.images[0]?.id).toBe(`dup-${String(REALMS_IMAGES_LIST_LIMIT).padStart(5, '0')}`);
    expect(second.images.at(-1)?.id).toBe(
      `dup-${String(REALMS_IMAGES_LIST_LIMIT * 2 - 1).padStart(5, '0')}`,
    );

    const third = await readJson<{
      images: Array<{ id: string }>;
      hasMore: boolean;
      nextCursor: string | null;
    }>(await GET(makeGetRequest(`?cursor=${encodeURIComponent(second.nextCursor ?? '')}`)));
    expect(third.hasMore).toBe(false);
    expect(third.nextCursor).toBeNull();
    expect(third.images).toHaveLength(5);
    expect(third.images[0]?.id).toBe(
      `dup-${String(REALMS_IMAGES_LIST_LIMIT * 2).padStart(5, '0')}`,
    );
  });

  it('escapes LIKE metacharacters in q before ilike', async () => {
    const ilike = vi.fn().mockImplementation(() => ({
      range: vi.fn().mockResolvedValue({ data: [], error: null }),
    }));
    const chain = createListSupabase({ ilike });
    mockCreateClient.mockResolvedValue(chain as never);

    const response = await GET(makeGetRequest('?q=%25'));

    expect(response.status).toBe(200);
    expect(ilike).toHaveBeenCalledWith('name', '%\\%%');
  });

  it('returns 400 when q exceeds the max length', async () => {
    const response = await GET(makeGetRequest(`?q=${'a'.repeat(101)}`));
    expect(response.status).toBe(400);
    expect(mockCreateClient).not.toHaveBeenCalled();
  });
});

describe('POST /api/images', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 when session is missing', async () => {
    mockRequireLiveUser.mockRejectedValue(new Error('Authentication required'));

    const response = await POST(makePostRequest());

    expect(response.status).toBe(401);
    await expect(readJson(response)).resolves.toEqual({ error: 'Unauthorized' });
    expect(mockCreateServiceRoleClient).not.toHaveBeenCalled();
  });

  it('returns 403 when the user is authenticated but not admin', async () => {
    mockRequireLiveUser.mockResolvedValue(USER);
    mockIsAdmin.mockResolvedValue(false);

    const response = await POST(makePostRequest());

    expect(response.status).toBe(403);
    await expect(readJson(response)).resolves.toEqual({ error: 'Admin access required' });
    expect(mockCreateServiceRoleClient).not.toHaveBeenCalled();
  });
});
