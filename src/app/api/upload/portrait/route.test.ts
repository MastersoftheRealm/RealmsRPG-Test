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
    detectImageMime: vi.fn(async () => 'image/png' as const),
  };
});

import { POST } from './route';
import { getSession } from '@/lib/supabase/session';
import { createClient } from '@/lib/supabase/server';
import { uploadLimiter } from '@/lib/rate-limit';
import { detectImageMime } from '@/lib/validate-image';

const mockGetSession = vi.mocked(getSession);
const mockCreateClient = vi.mocked(createClient);
const mockUploadLimiterCheck = vi.mocked(uploadLimiter.check);
const mockDetectImageMime = vi.mocked(detectImageMime);

const OWNER = { uid: 'owner-user', email: 'owner@example.com' };
const OTHER = { uid: 'other-user', email: 'other@example.com' };
const CHAR_ID = '11111111-1111-1111-1111-111111111111';

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

function makePostRequest(
  characterId: string,
  options: { headers?: Record<string, string>; file?: File | null; omitCharacterId?: boolean } = {},
) {
  const request = new NextRequest('http://localhost/api/upload/portrait', {
    method: 'POST',
    headers: { origin: 'http://localhost', ...options.headers },
  });
  const form = new FormData();
  const file =
    options.file === undefined
      ? new File([new Uint8Array([1, 2, 3])], 'p.png', { type: 'image/png' })
      : options.file;
  if (file) form.set('file', file);
  if (!options.omitCharacterId) form.set('characterId', characterId);
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

  it('returns 400 when the file is not an image MIME type', async () => {
    mockGetSession.mockResolvedValue({ user: OWNER, error: null });
    const response = await POST(
      makePostRequest(CHAR_ID, {
        file: new File([new Uint8Array([1, 2, 3])], 'notes.txt', { type: 'text/plain' }),
      }),
    );
    expect(response.status).toBe(400);
  });

  it('returns 400 when the file is missing', async () => {
    mockGetSession.mockResolvedValue({ user: OWNER, error: null });
    const response = await POST(makePostRequest(CHAR_ID, { file: null }));
    expect(response.status).toBe(400);
  });

  it('returns 400 when characterId is missing', async () => {
    mockGetSession.mockResolvedValue({ user: OWNER, error: null });
    const response = await POST(makePostRequest(CHAR_ID, { omitCharacterId: true }));
    expect(response.status).toBe(400);
  });

  it('returns 400 when magic bytes do not match a spoofed extension', async () => {
    mockGetSession.mockResolvedValue({ user: OWNER, error: null });
    mockDetectImageMime.mockResolvedValueOnce(null);
    const response = await POST(
      makePostRequest(CHAR_ID, {
        file: new File([new Uint8Array([1, 2, 3])], 'evil.png', { type: 'image/png' }),
      }),
    );
    expect(response.status).toBe(400);
  });

  it('returns 400 when the upload exceeds 5MB', async () => {
    mockGetSession.mockResolvedValue({ user: OWNER, error: null });
    const big = new File([new Uint8Array(5 * 1024 * 1024 + 1)], 'big.png', { type: 'image/png' });
    const response = await POST(makePostRequest(CHAR_ID, { file: big }));
    expect(response.status).toBe(400);
  });
});
