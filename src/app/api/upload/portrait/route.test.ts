import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/lib/supabase/session', () => ({
  getSession: vi.fn(),
}));

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
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
    detectImageMime: vi.fn(actual.detectImageMime),
  };
});

import { POST } from './route';
import { getSession } from '@/lib/supabase/session';
import { createClient } from '@/lib/supabase/server';
import { uploadLimiter } from '@/lib/rate-limit';

const mockGetSession = vi.mocked(getSession);
const mockCreateClient = vi.mocked(createClient);
const mockUploadLimiterCheck = vi.mocked(uploadLimiter.check);

const OWNER = { uid: 'owner-user', email: 'owner@example.com' };
const OTHER = { uid: 'other-user', email: 'other@example.com' };
const CHAR_ID = '11111111-1111-1111-1111-111111111111';
const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

function minimalPngFile(name: string, type = 'image/png'): File {
  return new File([new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])], name, {
    type,
  });
}

function createPortraitSupabase(owned: boolean) {
  const remove = vi.fn().mockResolvedValue({ error: null });
  return {
    remove,
    from: vi.fn((table: string) => {
      if (table !== 'characters') throw new Error(`Unexpected table: ${table}`);
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              maybeSingle: vi.fn().mockResolvedValue({
                data: owned ? { id: CHAR_ID } : null,
                error: null,
              }),
            }),
          }),
        }),
      };
    }),
    storage: {
      from: vi.fn(() => ({
        list: vi.fn().mockResolvedValue({ data: [], error: null }),
        remove,
        upload: vi.fn().mockResolvedValue({ error: null }),
        getPublicUrl: vi.fn((path: string) => ({
          data: { publicUrl: `https://cdn.test/${path}` },
        })),
      })),
    },
  };
}

function fileWithDeclaredSize(content: BlobPart, name: string, type: string, size: number): File {
  const file = new File([content], name, { type });
  Object.defineProperty(file, 'size', { value: size });
  return file;
}

function makePostRequest(
  characterId: string,
  options: {
    file?: File;
    headers?: Record<string, string>;
  } = {},
) {
  const request = new NextRequest('http://localhost/api/upload/portrait', {
    method: 'POST',
    headers: { origin: 'http://localhost', ...options.headers },
  });
  const form = new FormData();
  form.set('file', options.file ?? minimalPngFile('p.png'));
  form.set('characterId', characterId);
  vi.spyOn(request, 'formData').mockResolvedValue(form);
  return request;
}

async function readJson<T>(response: Response): Promise<T> {
  return response.json() as Promise<T>;
}

describe('POST /api/upload/portrait', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUploadLimiterCheck.mockResolvedValue({
      success: true,
      remaining: 9,
      reset: Date.now() + 60_000,
    });
  });

  it('returns 401 when session is missing', async () => {
    mockGetSession.mockResolvedValue({ user: null, error: 'No session' });

    const response = await POST(makePostRequest(CHAR_ID));

    expect(response.status).toBe(401);
    await expect(readJson(response)).resolves.toEqual({ error: 'Unauthorized' });
    expect(mockCreateClient).not.toHaveBeenCalled();
  });

  it('returns 400 when the file is not an image MIME type', async () => {
    mockGetSession.mockResolvedValue({ user: OWNER, error: null });

    const response = await POST(
      makePostRequest(CHAR_ID, {
        file: minimalPngFile('notes.txt', 'text/plain'),
      }),
    );

    expect(response.status).toBe(400);
    await expect(readJson(response)).resolves.toEqual({ error: 'Must be an image file' });
    expect(mockCreateClient).not.toHaveBeenCalled();
  });

  it('returns 400 when the image exceeds the upload size limit', async () => {
    mockGetSession.mockResolvedValue({ user: OWNER, error: null });

    const response = await POST(
      makePostRequest(CHAR_ID, {
        file: fileWithDeclaredSize(
          new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
          'big.png',
          'image/png',
          MAX_UPLOAD_BYTES + 1,
        ),
      }),
    );

    expect(response.status).toBe(400);
    await expect(readJson(response)).resolves.toEqual({
      error: 'Image must be less than 5MB',
    });
    expect(mockCreateClient).not.toHaveBeenCalled();
  });

  it('returns 400 when image MIME is spoofed and magic bytes fail validation', async () => {
    mockGetSession.mockResolvedValue({ user: OWNER, error: null });

    const response = await POST(
      makePostRequest(CHAR_ID, {
        file: new File([new TextEncoder().encode('not-a-real-image')], 'fake.png', {
          type: 'image/png',
        }),
      }),
    );

    expect(response.status).toBe(400);
    await expect(readJson(response)).resolves.toEqual({ error: 'Invalid image file' });
    expect(mockCreateClient).not.toHaveBeenCalled();
  });

  it('returns 404 when another user uploads a portrait for a character they do not own (IDOR)', async () => {
    mockGetSession.mockResolvedValue({ user: OTHER, error: null });
    mockCreateClient.mockResolvedValue(createPortraitSupabase(false) as never);

    const response = await POST(makePostRequest(CHAR_ID));

    expect(response.status).toBe(404);
    await expect(readJson(response)).resolves.toEqual({ error: 'Character not found' });
  });

  it('uploads a portrait for the character owner', async () => {
    mockGetSession.mockResolvedValue({ user: OWNER, error: null });
    mockCreateClient.mockResolvedValue(createPortraitSupabase(true) as never);

    const response = await POST(makePostRequest(CHAR_ID));

    expect(response.status).toBe(200);
    const body = await readJson<{ url: string }>(response);
    expect(body.url).toContain(OWNER.uid);
    expect(body.url).toContain(CHAR_ID);
  });

  it('removes other portrait extensions before writing the new png', async () => {
    mockGetSession.mockResolvedValue({ user: OWNER, error: null });
    const supabase = createPortraitSupabase(true);
    mockCreateClient.mockResolvedValue(supabase as never);

    const response = await POST(makePostRequest(CHAR_ID));

    expect(response.status).toBe(200);
    expect(supabase.remove).toHaveBeenCalledWith(
      expect.arrayContaining([`${OWNER.uid}/${CHAR_ID}.jpg`, `${OWNER.uid}/${CHAR_ID}.webp`]),
    );
    const removed = supabase.remove.mock.calls[0]?.[0] as string[];
    expect(removed).not.toContain(`${OWNER.uid}/${CHAR_ID}.png`);
  });
});
