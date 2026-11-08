import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { headers } from 'next/headers';
import {
  assertCampaignDetailHttpAccess,
  assertCharacterSheetHttpAccess,
} from '@/lib/server/assert-resource-http-access';
import { RESOURCE_ACCESS_UNAVAILABLE_DIGEST } from '@/lib/server/resource-access-unavailable';

vi.mock('next/headers', () => ({
  headers: vi.fn(async () => ({
    get(name: string) {
      if (name === 'cookie') return '';
      return null;
    },
  })),
}));

const originalSite = process.env.NEXT_PUBLIC_SITE_URL;

beforeEach(() => {
  process.env.NEXT_PUBLIC_SITE_URL = 'http://localhost:3000';
});

afterEach(() => {
  if (originalSite === undefined) delete process.env.NEXT_PUBLIC_SITE_URL;
  else process.env.NEXT_PUBLIC_SITE_URL = originalSite;
});

function httpStatus(error: unknown): number | null {
  if (!error || typeof error !== 'object' || !('digest' in error)) return null;
  const digest = (error as { digest?: unknown }).digest;
  if (typeof digest !== 'string' || !digest.startsWith('NEXT_HTTP_ERROR_FALLBACK;')) return null;
  return Number(digest.split(';')[1]);
}

function redirectUrl(error: unknown): string | null {
  if (!error || typeof error !== 'object' || !('digest' in error)) return null;
  const digest = (error as { digest?: unknown }).digest;
  if (typeof digest !== 'string' || !digest.startsWith('NEXT_REDIRECT;')) return null;
  return digest.split(';')[2] ?? null;
}

describe('assert-resource-http-access', () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
  });

  it('throws HTTP 404 when the character API denies the sheet', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('null', { status: 404 })),
    );

    try {
      await assertCharacterSheetHttpAccess('11111111-1111-1111-1111-111111111111');
      throw new Error('expected notFound');
    } catch (error) {
      expect(httpStatus(error)).toBe(404);
    }
  });

  it('does not throw when the character API returns 200 (own or readable sheet)', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('{"character":{}}', { status: 200 })),
    );

    await expect(assertCharacterSheetHttpAccess('owned-character')).resolves.toBeUndefined();
  });

  it('does not 404 a guest character id and does not call the API', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    await expect(assertCharacterSheetHttpAccess('local-guest')).resolves.toBeUndefined();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('throws HTTP 404 when the campaign API denies the detail page', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('null', { status: 404 })),
    );

    try {
      await assertCampaignDetailHttpAccess('59c90016-0000-0000-0000-000000000000');
      throw new Error('expected notFound');
    } catch (error) {
      expect(httpStatus(error)).toBe(404);
    }
  });

  it('does not throw when the viewer is a campaign member', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('{"id":"camp"}', { status: 200 })),
    );

    await expect(assertCampaignDetailHttpAccess('camp')).resolves.toBeUndefined();
  });

  it('redirects to login when the campaign API returns 401', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string) => {
        expect(url).toBe('http://localhost:3000/api/campaigns/camp');
        return new Response('{"error":"Unauthorized"}', { status: 401 });
      }),
    );

    try {
      await assertCampaignDetailHttpAccess('camp');
      throw new Error('expected redirect');
    } catch (error) {
      expect(redirectUrl(error)).toBe('/login?returnTo=%2Fcampaigns%2Fcamp');
    }
  });

  it('uses the canonical site URL even when hostile forwarded headers are present', async () => {
    vi.mocked(headers).mockResolvedValueOnce({
      get(name: string) {
        if (name === 'x-forwarded-host') return 'evil.example';
        if (name === 'x-forwarded-proto') return 'https';
        if (name === 'host') return 'evil.example';
        if (name === 'cookie') return 'session=leak-me';
        return null;
      },
    } as Awaited<ReturnType<typeof headers>>);

    const fetchMock = vi.fn(async (url: string, init?: RequestInit) => {
      expect(url).toBe('http://localhost:3000/api/campaigns/camp');
      expect(init?.headers).toMatchObject({ cookie: 'session=leak-me' });
      return new Response('{"id":"camp"}', { status: 200 });
    });
    vi.stubGlobal('fetch', fetchMock);

    await expect(assertCampaignDetailHttpAccess('camp')).resolves.toBeUndefined();
  });

  it('throws a recoverable unavailable error when the internal API fetch fails', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new Error('network down');
      }),
    );

    await expect(assertCampaignDetailHttpAccess('camp')).rejects.toMatchObject({
      digest: RESOURCE_ACCESS_UNAVAILABLE_DIGEST,
    });
  });

  it('throws unavailable on campaign API 503', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('error', { status: 503 })),
    );

    await expect(assertCampaignDetailHttpAccess('camp')).rejects.toMatchObject({
      digest: RESOURCE_ACCESS_UNAVAILABLE_DIGEST,
    });
  });

  it('throws unavailable on character API 429 (never fail-open)', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('rate limited', { status: 429 })),
    );

    await expect(assertCharacterSheetHttpAccess('char-1')).rejects.toMatchObject({
      digest: RESOURCE_ACCESS_UNAVAILABLE_DIGEST,
    });
  });

  it('throws unavailable on character API 503', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('error', { status: 503 })),
    );

    await expect(assertCharacterSheetHttpAccess('char-1')).rejects.toMatchObject({
      digest: RESOURCE_ACCESS_UNAVAILABLE_DIGEST,
    });
  });

  it('throws unavailable on campaign API 429', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('rate limited', { status: 429 })),
    );

    await expect(assertCampaignDetailHttpAccess('camp')).rejects.toMatchObject({
      digest: RESOURCE_ACCESS_UNAVAILABLE_DIGEST,
    });
  });
});
