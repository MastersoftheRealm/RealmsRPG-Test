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
    detectImageMime: vi.fn(async () => 'image/png'),
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

function createPortraitSupabase(owned: boolean) {
  return {
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
        remove: vi.fn().mockResolvedValue({ error: null }),
        upload: vi.fn().mockResolvedValue({ error: null }),
        getPublicUrl: vi.fn((path: string) => ({
          data: { publicUrl: `https://cdn.test/${path}` },
        })),
      })),
    },
  };
}

function makePostRequest(characterId: string, headers: Record<string, string> = {}) {
  const request = new NextRequest('http://localhost/api/upload/portrait', {
    method: 'POST',
    headers: { origin: 'http://localhost', ...headers },
  });
  const form = new FormData();
  form.set('file', new File([new Uint8Array([1, 2, 3])], 'p.png', { type: 'image/png' }));
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
});
