import { beforeEach, describe, expect, it, vi } from 'vitest';
import CharacterSheetLayout from '@/app/(detail)/characters/[id]/layout';
import CampaignDetailLayout from '@/app/(detail)/campaigns/[id]/layout';

vi.mock('next/headers', () => ({
  headers: vi.fn(async () => ({
    get(name: string) {
      if (name === 'x-forwarded-host' || name === 'host') return 'localhost:3000';
      if (name === 'x-forwarded-proto') return 'http';
      if (name === 'cookie') return 'sb=session';
      return null;
    },
  })),
}));

function httpStatus(error: unknown): number | null {
  if (!error || typeof error !== 'object' || !('digest' in error)) return null;
  const digest = (error as { digest?: unknown }).digest;
  if (typeof digest !== 'string' || !digest.startsWith('NEXT_HTTP_ERROR_FALLBACK;')) return null;
  return Number(digest.split(';')[1]);
}

describe('detail layouts HTTP status', () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns 404 for a denied character before rendering the sheet', async () => {
    const fetchMock = vi.fn(async (url: string) => {
      expect(url).toContain('/api/characters/denied-id');
      return new Response('null', { status: 404 });
    });
    vi.stubGlobal('fetch', fetchMock);

    try {
      await CharacterSheetLayout({
        children: 'sheet',
        params: Promise.resolve({ id: 'denied-id' }),
      });
      throw new Error('expected notFound');
    } catch (error) {
      expect(httpStatus(error)).toBe(404);
    }
    expect(fetchMock).toHaveBeenCalledOnce();
  });

  it('returns the sheet when the character API is 200', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('{"character":{"id":"mine"}}', { status: 200 })),
    );

    const result = await CharacterSheetLayout({
      children: 'sheet',
      params: Promise.resolve({ id: 'mine' }),
    });

    expect(result.props.children).toBe('sheet');
  });

  it('returns 200 for a guest character without calling the API', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    const result = await CharacterSheetLayout({
      children: 'guest-sheet',
      params: Promise.resolve({ id: 'local-guest' }),
    });

    expect(result.props.children).toBe('guest-sheet');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('returns 404 for a denied campaign before rendering the page', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string) => {
        expect(String(url)).toContain('/api/campaigns/not-a-member');
        return new Response('null', { status: 404 });
      }),
    );

    try {
      await CampaignDetailLayout({
        children: 'campaign',
        params: Promise.resolve({ id: 'not-a-member' }),
      });
      throw new Error('expected notFound');
    } catch (error) {
      expect(httpStatus(error)).toBe(404);
    }
  });

  it('returns the campaign when the viewer is a member', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('{"id":"mine"}', { status: 200 })),
    );

    const result = await CampaignDetailLayout({
      children: 'campaign',
      params: Promise.resolve({ id: 'mine' }),
    });

    expect(result.props.children).toBe('campaign');
  });
});
