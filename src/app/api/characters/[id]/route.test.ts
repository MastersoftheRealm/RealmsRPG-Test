import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/lib/supabase/session', () => ({
  getSession: vi.fn(),
}));

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}));

vi.mock('@/lib/owner-library-for-view', () => ({
  getOwnerLibraryForView: vi.fn(),
}));

import { GET } from './route';
import { getSession } from '@/lib/supabase/session';
import { createClient } from '@/lib/supabase/server';
import { getOwnerLibraryForView } from '@/lib/owner-library-for-view';

const mockGetSession = vi.mocked(getSession);
const mockCreateClient = vi.mocked(createClient);
const mockGetOwnerLibraryForView = vi.mocked(getOwnerLibraryForView);

const OWNER = { uid: 'owner-user', email: 'owner@example.com' };
const OTHER = { uid: 'other-user', email: 'other@example.com' };

type CharacterRow = {
  id: string;
  user_id: string;
  data: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

function makeCharacterRow(
  id: string,
  userId: string,
  overrides: Partial<CharacterRow['data']> = {}
): CharacterRow {
  return {
    id,
    user_id: userId,
    data: { name: 'Test Hero', level: 1, visibility: 'private', ...overrides },
    created_at: '2026-07-01T12:00:00.000Z',
    updated_at: '2026-07-01T12:00:00.000Z',
  };
}

function createMockSupabase(characterRow: CharacterRow | null) {
  return {
    from: vi.fn((table: string) => {
      if (table === 'characters') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              maybeSingle: vi.fn().mockResolvedValue({ data: characterRow, error: null }),
            }),
          }),
        };
      }
      if (table === 'campaign_members' || table === 'campaigns') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ data: [], error: null }),
            in: vi.fn().mockResolvedValue({ data: [], error: null }),
          }),
        };
      }
      throw new Error(`Unexpected table: ${table}`);
    }),
  };
}

function makeGetRequest(id: string) {
  return new NextRequest(`http://localhost/api/characters/${id}`);
}

async function readJson<T>(response: Response): Promise<T> {
  return response.json() as Promise<T>;
}

describe('GET /api/characters/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetOwnerLibraryForView.mockResolvedValue({ powers: [], techniques: [], items: [], creatures: [] });
  });

  it('returns 404 null for a nonexistent character id', async () => {
    mockGetSession.mockResolvedValue({ user: OTHER, error: null });
    mockCreateClient.mockResolvedValue(createMockSupabase(null) as never);

    const response = await GET(makeGetRequest('missing-char-id'), {
      params: Promise.resolve({ id: 'missing-char-id' }),
    });

    expect(response.status).toBe(404);
    await expect(readJson(response)).resolves.toBeNull();
  });

  it('returns 404 null for another users private character (not 403)', async () => {
    const row = makeCharacterRow('char-private', OWNER.uid, { visibility: 'private' });
    mockGetSession.mockResolvedValue({ user: OTHER, error: null });
    mockCreateClient.mockResolvedValue(createMockSupabase(row) as never);

    const response = await GET(makeGetRequest('char-private'), {
      params: Promise.resolve({ id: 'char-private' }),
    });

    expect(response.status).toBe(404);
    await expect(readJson(response)).resolves.toBeNull();
  });

  it('returns the character for the owner', async () => {
    const row = makeCharacterRow('char-owned', OWNER.uid, { visibility: 'private' });
    mockGetSession.mockResolvedValue({ user: OWNER, error: null });
    mockCreateClient.mockResolvedValue(createMockSupabase(row) as never);

    const response = await GET(makeGetRequest('char-owned'), {
      params: Promise.resolve({ id: 'char-owned' }),
    });

    expect(response.status).toBe(200);
    const body = await readJson<{ character: { id: string; name: string } }>(response);
    expect(body.character.id).toBe('char-owned');
    expect(body.character.name).toBe('Test Hero');
  });

  it('returns public characters to non-owner viewers', async () => {
    const row = makeCharacterRow('char-public', OWNER.uid, { visibility: 'public' });
    mockGetSession.mockResolvedValue({ user: OTHER, error: null });
    mockCreateClient.mockResolvedValue(createMockSupabase(row) as never);
    mockGetOwnerLibraryForView.mockResolvedValue({ powers: [], techniques: [], items: [], creatures: [] });

    const response = await GET(makeGetRequest('char-public'), {
      params: Promise.resolve({ id: 'char-public' }),
    });

    expect(response.status).toBe(200);
    const body = await readJson<{ character: { id: string }; libraryForView: unknown }>(response);
    expect(body.character.id).toBe('char-public');
    expect(body.libraryForView).toEqual({ powers: [], techniques: [], items: [], creatures: [] });
  });
});
