import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/lib/admin', () => ({
  requireLiveAdminSession: vi.fn(),
}));

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
  createServiceRoleClient: vi.fn(),
}));

vi.mock('@/lib/rate-limit', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/rate-limit')>();
  return {
    ...actual,
    uploadLimiter: {
      check: vi.fn(() =>
        Promise.resolve({ success: true, remaining: 9, reset: Date.now() + 60_000 }),
      ),
    },
  };
});

vi.mock('@/lib/validate-image', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/validate-image')>();
  return {
    ...actual,
    validateImageMagicBytes: vi.fn(async () => true),
    detectImageMime: vi.fn(async () => 'image/png'),
  };
});

vi.mock('@/lib/realms-images-server', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/realms-images-server')>();
  return {
    ...actual,
    replaceImageCategories: vi.fn(async () => ({ ok: true as const })),
    fetchRealmsImageById: vi.fn(),
  };
});

import { REALMS_IMAGES_LIST_LIMIT, type RealmsImage } from '@/lib/realms-images';
import { encodeRealmsImagesListCursor } from '@/lib/realms-images-list-cursor';
import { GET, POST } from './route';
import { requireLiveAdminSession } from '@/lib/admin';
import { createClient, createServiceRoleClient } from '@/lib/supabase/server';
import { replaceImageCategories, fetchRealmsImageById } from '@/lib/realms-images-server';

const mockRequireLiveAdminSession = vi.mocked(requireLiveAdminSession);
const mockCreateClient = vi.mocked(createClient);
const mockCreateServiceRoleClient = vi.mocked(createServiceRoleClient);
const mockReplaceImageCategories = vi.mocked(replaceImageCategories);
const mockFetchRealmsImageById = vi.mocked(fetchRealmsImageById);

const USER = { uid: 'user-123', email: 'hero@example.com' };
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

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

function makeStreamedMultipartPost(totalBytes: number) {
  const chunkSize = 64 * 1024;
  const chunk = new Uint8Array(chunkSize).fill(0x41);
  let sent = 0;
  let bytesConsumed = 0;

  const stream = new ReadableStream<Uint8Array>({
    pull(controller) {
      if (sent >= totalBytes) {
        controller.close();
        return;
      }
      const remaining = totalBytes - sent;
      const size = Math.min(chunk.byteLength, remaining);
      bytesConsumed += size;
      controller.enqueue(chunk.subarray(0, size));
      sent += size;
    },
  });

  type NextRequestInit = NonNullable<ConstructorParameters<typeof NextRequest>[1]>;
  const init: NextRequestInit & { duplex: 'half' } = {
    method: 'POST',
    headers: {
      origin: 'http://localhost',
      'content-type': 'multipart/form-data; boundary=----vitest',
    },
    body: stream,
    duplex: 'half',
  };

  const request = new NextRequest('http://localhost/api/images', init);
  return { request, getBytesConsumed: () => bytesConsumed };
}

function makePostRequestWithImageForm() {
  const form = new FormData();
  form.set(
    'file',
    new File([new Uint8Array([137, 80, 78, 71])], 'asset.png', { type: 'image/png' }),
  );
  form.set('name', 'Regression asset');
  form.set('categories', JSON.stringify(['weapon']));
  return new NextRequest('http://localhost/api/images', {
    method: 'POST',
    headers: { origin: 'http://localhost' },
    body: form,
  });
}

function createAdminUploadSupabase() {
  const storageUpload = vi.fn().mockResolvedValue({ error: null });
  const rowInsert = vi.fn().mockResolvedValue({ error: null });
  return {
    storageUpload,
    rowInsert,
    client: {
      storage: {
        from: vi.fn(() => ({
          upload: storageUpload,
          getPublicUrl: vi.fn((path: string) => ({
            data: { publicUrl: `https://cdn.test/${path}` },
          })),
        })),
      },
      from: vi.fn((table: string) => {
        if (table !== 'realms_images') throw new Error(`Unexpected table: ${table}`);
        return { insert: rowInsert };
      }),
    },
  };
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
    expect(mockRequireLiveAdminSession).not.toHaveBeenCalled();
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
    mockRequireLiveAdminSession.mockResolvedValue({
      ok: false,
      status: 401,
      body: { error: 'Unauthorized' },
    });

    const response = await POST(makePostRequest());

    expect(response.status).toBe(401);
    await expect(readJson(response)).resolves.toEqual({ error: 'Unauthorized' });
    expect(mockCreateServiceRoleClient).not.toHaveBeenCalled();
  });

  it('returns 403 when the user is authenticated but not admin', async () => {
    mockRequireLiveAdminSession.mockResolvedValue({
      ok: false,
      status: 403,
      body: { error: 'Forbidden' },
    });

    const response = await POST(makePostRequest());

    expect(response.status).toBe(403);
    await expect(readJson(response)).resolves.toEqual({ error: 'Forbidden' });
    expect(mockCreateServiceRoleClient).not.toHaveBeenCalled();
  });

  it('rejects an oversized upload before buffering the full body (API-024)', async () => {
    mockRequireLiveAdminSession.mockResolvedValue({ ok: true, userId: USER.uid });

    const totalBytes = MAX_IMAGE_BYTES + 2 * 1024 * 1024;
    const { request, getBytesConsumed } = makeStreamedMultipartPost(totalBytes);
    const formDataSpy = vi.spyOn(request, 'formData');

    const response = await POST(request);

    expect(response.status).toBe(400);
    await expect(readJson(response)).resolves.toEqual({ error: 'Image must be less than 5MB' });
    expect(formDataSpy).not.toHaveBeenCalled();
    expect(getBytesConsumed()).toBeLessThan(totalBytes);
    expect(mockCreateServiceRoleClient).not.toHaveBeenCalled();
  });

  it('reaches the storage upload path when the user is admin (COMP3-021)', async () => {
    mockRequireLiveAdminSession.mockResolvedValue({ ok: true, userId: USER.uid });

    const { client, storageUpload, rowInsert } = createAdminUploadSupabase();
    mockCreateServiceRoleClient.mockReturnValue(client as never);

    const createdImage: RealmsImage = {
      id: 'img-regression-1',
      name: 'Regression asset',
      categories: ['weapon'],
      storagePath: 'realms/img-regression-1.png',
      publicUrl: 'https://cdn.test/realms/img-regression-1.png',
      createdAt: '2026-11-08T00:00:00.000Z',
      updatedAt: '2026-11-08T00:00:00.000Z',
      createdBy: USER.uid,
    };
    mockFetchRealmsImageById.mockResolvedValue(createdImage);
    mockReplaceImageCategories.mockResolvedValue({ ok: true });

    const response = await POST(makePostRequestWithImageForm());

    expect(response.status).toBe(201);
    expect(mockRequireLiveAdminSession).toHaveBeenCalled();
    expect(mockCreateServiceRoleClient).toHaveBeenCalled();
    expect(storageUpload).toHaveBeenCalled();
    expect(rowInsert).toHaveBeenCalled();
    expect(mockReplaceImageCategories).toHaveBeenCalled();
    await expect(readJson(response)).resolves.toMatchObject({
      id: createdImage.id,
      name: createdImage.name,
    });
  });
});
