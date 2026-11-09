import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/lib/admin', () => ({
  requireLiveAdminSession: vi.fn(),
}));

vi.mock('@/lib/supabase/server', () => ({
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
    detectImageMime: vi.fn(async () => 'image/jpeg'),
  };
});

vi.mock('@/lib/realms-images-server', () => ({
  fetchRealmsImageById: vi.fn(),
}));

vi.mock('@/lib/realms-image-consumers', () => ({
  syncRealmsImageCacheUrls: vi.fn(async () => ({ errors: [] as string[] })),
}));

import { POST } from './route';
import { realmsImageStoragePath } from '@/lib/realms-images';
import { fetchRealmsImageById } from '@/lib/realms-images-server';
import { syncRealmsImageCacheUrls } from '@/lib/realms-image-consumers';
import { requireLiveAdminSession } from '@/lib/admin';
import { createServiceRoleClient } from '@/lib/supabase/server';

const mockRequireLiveAdminSession = vi.mocked(requireLiveAdminSession);
const mockCreateServiceRoleClient = vi.mocked(createServiceRoleClient);
const mockFetchRealmsImageById = vi.mocked(fetchRealmsImageById);
const mockSyncRealmsImageCacheUrls = vi.mocked(syncRealmsImageCacheUrls);

const USER = { uid: 'user-123', email: 'hero@example.com' };
const IMAGE_ID = 'img-replace-order';
const PREVIOUS_PATH = 'library/img-replace-order.png';
const NEXT_PATH = realmsImageStoragePath(IMAGE_ID, 'jpg');

const EXISTING_IMAGE = {
  id: IMAGE_ID,
  name: 'Token',
  categories: ['portrait'],
  storagePath: PREVIOUS_PATH,
  publicUrl: 'https://cdn.test/old.png',
  createdAt: '2026-08-01T00:00:00.000Z',
  updatedAt: '2026-08-01T00:00:00.000Z',
  createdBy: 'admin-user',
};

function makeReplaceRequestWithFile(id: string) {
  const request = makePostRequest(id);
  const form = new FormData();
  form.set(
    'file',
    new File([new Uint8Array([255, 216, 255])], 'token.jpg', { type: 'image/jpeg' }),
  );
  vi.spyOn(request, 'formData').mockResolvedValue(form);
  return request;
}

function createReplaceSupabase(options: { updateError?: { message: string } | null }) {
  const storageUpload = vi.fn().mockResolvedValue({ error: null });
  const storageRemove = vi.fn().mockResolvedValue({ error: null });
  const rowUpdate = vi.fn().mockReturnValue({
    eq: vi.fn().mockResolvedValue({
      error: options.updateError ?? null,
    }),
  });

  return {
    storageUpload,
    storageRemove,
    rowUpdate,
    client: {
      storage: {
        from: vi.fn(() => ({
          upload: storageUpload,
          remove: storageRemove,
          getPublicUrl: vi.fn((path: string) => ({
            data: { publicUrl: `https://cdn.test/${path}` },
          })),
        })),
      },
      from: vi.fn((table: string) => {
        if (table !== 'realms_images') throw new Error(`Unexpected table: ${table}`);
        return { update: rowUpdate };
      }),
    },
  };
}

const replaceParams = { params: Promise.resolve({ id: IMAGE_ID }) };

function makePostRequest(id: string) {
  return new NextRequest(`http://localhost/api/images/${id}/replace`, {
    method: 'POST',
    headers: { origin: 'http://localhost' },
  });
}

async function readJson<T>(response: Response): Promise<T> {
  return response.json() as Promise<T>;
}

describe('POST /api/images/[id]/replace', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 when session is missing', async () => {
    mockRequireLiveAdminSession.mockResolvedValue({
      ok: false,
      status: 401,
      body: { error: 'Unauthorized' },
    });

    const response = await POST(makePostRequest('img-1'), {
      params: Promise.resolve({ id: 'img-1' }),
    });

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

    const response = await POST(makePostRequest('img-1'), {
      params: Promise.resolve({ id: 'img-1' }),
    });

    expect(response.status).toBe(403);
    await expect(readJson(response)).resolves.toEqual({ error: 'Forbidden' });
    expect(mockCreateServiceRoleClient).not.toHaveBeenCalled();
  });

  it('on failed realms_images update, keeps the previous object and removes only the new path', async () => {
    mockRequireLiveAdminSession.mockResolvedValue({ ok: true, userId: USER.uid });
    const supabase = createReplaceSupabase({
      updateError: { message: 'update failed' },
    });
    mockCreateServiceRoleClient.mockReturnValue(supabase.client as never);
    mockFetchRealmsImageById.mockResolvedValue(EXISTING_IMAGE as never);

    const response = await POST(makeReplaceRequestWithFile(IMAGE_ID), replaceParams);

    expect(response.status).toBe(500);
    await expect(readJson(response)).resolves.toEqual({ error: 'Replace failed' });
    expect(supabase.storageUpload).toHaveBeenCalled();
    expect(supabase.storageRemove).toHaveBeenCalledTimes(1);
    expect(supabase.storageRemove).toHaveBeenCalledWith([NEXT_PATH]);
    expect(supabase.storageRemove).not.toHaveBeenCalledWith([PREVIOUS_PATH]);
    expect(mockSyncRealmsImageCacheUrls).not.toHaveBeenCalled();
  });

  it('on successful realms_images update, removes only the previous storage path', async () => {
    mockRequireLiveAdminSession.mockResolvedValue({ ok: true, userId: USER.uid });
    const supabase = createReplaceSupabase({ updateError: null });
    mockCreateServiceRoleClient.mockReturnValue(supabase.client as never);
    mockFetchRealmsImageById.mockResolvedValueOnce(EXISTING_IMAGE as never).mockResolvedValueOnce({
      ...EXISTING_IMAGE,
      storagePath: NEXT_PATH,
      publicUrl: `https://cdn.test/${NEXT_PATH}`,
    } as never);

    const response = await POST(makeReplaceRequestWithFile(IMAGE_ID), replaceParams);

    expect(response.status).toBe(200);
    expect(supabase.storageRemove).toHaveBeenCalledTimes(1);
    expect(supabase.storageRemove).toHaveBeenCalledWith([PREVIOUS_PATH]);
    expect(supabase.storageRemove).not.toHaveBeenCalledWith([NEXT_PATH]);
    expect(mockSyncRealmsImageCacheUrls).toHaveBeenCalled();
  });
});
