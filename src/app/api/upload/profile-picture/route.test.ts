import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/lib/supabase/session', () => ({
  getSession: vi.fn(),
}));

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
  createServiceRoleClient: vi.fn(),
}));

vi.mock('@/lib/role-policy', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/role-policy')>();
  return {
    ...actual,
    getRolePolicyForUser: vi.fn(),
  };
});

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

import { DELETE, POST } from './route';
import { getSession } from '@/lib/supabase/session';
import { createClient, createServiceRoleClient } from '@/lib/supabase/server';
import { getDefaultRolePolicy, getRolePolicyForUser } from '@/lib/role-policy';
import { uploadLimiter } from '@/lib/rate-limit';

const mockGetSession = vi.mocked(getSession);
const mockCreateClient = vi.mocked(createClient);
const mockCreateServiceRoleClient = vi.mocked(createServiceRoleClient);
const mockGetRolePolicyForUser = vi.mocked(getRolePolicyForUser);
const mockUploadLimiterCheck = vi.mocked(uploadLimiter.check);

const USER = { uid: 'user-123', email: 'hero@example.com' };
const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

function minimalPngFile(name: string, type = 'image/png'): File {
  return new File([new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])], name, {
    type,
  });
}

function fileWithDeclaredSize(content: BlobPart, name: string, type: string, size: number): File {
  const file = new File([content], name, { type });
  Object.defineProperty(file, 'size', { value: size });
  return file;
}

function makePostRequest(file?: File) {
  const request = new NextRequest('http://localhost/api/upload/profile-picture', {
    method: 'POST',
    headers: { origin: 'http://localhost' },
  });
  const form = new FormData();
  form.set('file', file ?? minimalPngFile('avatar.png'));
  vi.spyOn(request, 'formData').mockResolvedValue(form);
  return request;
}

function createProfilePictureUploadSupabase() {
  const upload = vi.fn().mockResolvedValue({ error: null });
  const upsert = vi.fn().mockResolvedValue({ error: null });
  const sessionClient = {
    storage: {
      from: vi.fn(() => ({
        list: vi.fn().mockResolvedValue({ data: [], error: null }),
        remove: vi.fn().mockResolvedValue({ error: null }),
        upload,
        getPublicUrl: vi.fn((path: string) => ({
          data: { publicUrl: `https://cdn.test/profile-pictures/${path}` },
        })),
      })),
    },
  };
  const adminClient = {
    from: vi.fn((table: string) => {
      if (table === 'user_profiles') {
        return { upsert };
      }
      return {};
    }),
  };
  return { sessionClient, adminClient, upload, upsert };
}

function makeDeleteRequest() {
  return new NextRequest('http://localhost/api/upload/profile-picture', {
    method: 'DELETE',
    headers: { origin: 'http://localhost' },
  });
}

async function readJson<T>(response: Response): Promise<T> {
  return response.json() as Promise<T>;
}

describe('POST /api/upload/profile-picture', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUploadLimiterCheck.mockResolvedValue({
      success: true,
      remaining: 9,
      reset: Date.now() + 60_000,
    });
    mockCreateClient.mockResolvedValue({} as never);
  });

  it('returns 401 when session is missing', async () => {
    mockGetSession.mockResolvedValue({ user: null, error: 'No session' });

    const response = await POST(makePostRequest());

    expect(response.status).toBe(401);
    await expect(readJson(response)).resolves.toEqual({ error: 'Unauthorized' });
    expect(mockGetRolePolicyForUser).not.toHaveBeenCalled();
  });

  it('returns 403 when the caller role cannot upload profile pictures', async () => {
    mockGetSession.mockResolvedValue({ user: USER, error: null });
    mockGetRolePolicyForUser.mockResolvedValue(getDefaultRolePolicy('new_player'));

    const response = await POST(makePostRequest());

    expect(response.status).toBe(403);
    await expect(readJson(response)).resolves.toEqual({
      error: 'Your role cannot upload profile pictures.',
    });
  });

  it('returns 400 when the file is not an image MIME type', async () => {
    mockGetSession.mockResolvedValue({ user: USER, error: null });
    mockGetRolePolicyForUser.mockResolvedValue(getDefaultRolePolicy('playtester'));

    const response = await POST(makePostRequest(minimalPngFile('notes.txt', 'text/plain')));

    expect(response.status).toBe(400);
    await expect(readJson(response)).resolves.toEqual({ error: 'Must be an image file' });
    expect(mockCreateServiceRoleClient).not.toHaveBeenCalled();
  });

  it('returns 400 when the image exceeds the upload size limit', async () => {
    mockGetSession.mockResolvedValue({ user: USER, error: null });
    mockGetRolePolicyForUser.mockResolvedValue(getDefaultRolePolicy('playtester'));

    const response = await POST(
      makePostRequest(
        fileWithDeclaredSize(
          new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
          'big.png',
          'image/png',
          MAX_UPLOAD_BYTES + 1,
        ),
      ),
    );

    expect(response.status).toBe(400);
    await expect(readJson(response)).resolves.toEqual({
      error: 'Image must be less than 5MB',
    });
    expect(mockCreateServiceRoleClient).not.toHaveBeenCalled();
  });

  it('returns 400 when image MIME is spoofed and magic bytes fail validation', async () => {
    mockGetSession.mockResolvedValue({ user: USER, error: null });
    mockGetRolePolicyForUser.mockResolvedValue(getDefaultRolePolicy('playtester'));

    const response = await POST(
      makePostRequest(
        new File([new TextEncoder().encode('not-a-real-image')], 'fake.png', {
          type: 'image/png',
        }),
      ),
    );

    expect(response.status).toBe(400);
    await expect(readJson(response)).resolves.toEqual({ error: 'Invalid image file' });
    expect(mockCreateServiceRoleClient).not.toHaveBeenCalled();
  });

  it('uploads a valid profile picture when the role allows it', async () => {
    mockGetSession.mockResolvedValue({ user: USER, error: null });
    mockGetRolePolicyForUser.mockResolvedValue(getDefaultRolePolicy('playtester'));
    const { sessionClient, adminClient, upload } = createProfilePictureUploadSupabase();
    mockCreateClient.mockResolvedValue(sessionClient as never);
    mockCreateServiceRoleClient.mockReturnValue(adminClient as never);

    const response = await POST(makePostRequest());

    expect(response.status).toBe(200);
    const body = await readJson<{ url: string }>(response);
    expect(body.url).toContain(USER.uid);
    expect(upload).toHaveBeenCalled();
  });
});

describe('DELETE /api/upload/profile-picture', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUploadLimiterCheck.mockResolvedValue({
      success: true,
      remaining: 9,
      reset: Date.now() + 60_000,
    });
    mockCreateServiceRoleClient.mockReturnValue({
      storage: {
        from: () => ({
          list: vi.fn(() => Promise.resolve({ data: [], error: null })),
          remove: vi.fn(() => Promise.resolve({ error: null })),
        }),
      },
      from: vi.fn(() => ({})),
    } as never);
  });

  it('returns 401 when session is missing', async () => {
    mockGetSession.mockResolvedValue({ user: null, error: 'No session' });

    const response = await DELETE(makeDeleteRequest());

    expect(response.status).toBe(401);
    await expect(readJson(response)).resolves.toEqual({ error: 'Unauthorized' });
  });

  it('clears photo_url and returns 204', async () => {
    mockGetSession.mockResolvedValue({ user: USER, error: null });
    const updateEq = vi.fn(() => Promise.resolve({ error: null }));
    const update = vi.fn(() => ({ eq: updateEq }));
    mockCreateServiceRoleClient.mockReturnValue({
      storage: {
        from: () => ({
          list: vi.fn(() => Promise.resolve({ data: [], error: null })),
          remove: vi.fn(() => Promise.resolve({ error: null })),
        }),
      },
      from: vi.fn((table: string) => {
        if (table === 'user_profiles') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                maybeSingle: vi.fn(() =>
                  Promise.resolve({
                    data: { photo_url: 'https://cdn.test/profile-pictures/user-123.png' },
                    error: null,
                  }),
                ),
              })),
            })),
            update,
          };
        }
        return {};
      }),
    } as never);

    const response = await DELETE(makeDeleteRequest());

    expect(response.status).toBe(204);
    expect(update).toHaveBeenCalledWith(expect.objectContaining({ photo_url: null }));
  });
});
