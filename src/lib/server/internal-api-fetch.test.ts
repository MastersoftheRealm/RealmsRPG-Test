import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { headers } from 'next/headers';
import { fetchInternalApi } from '@/lib/server/internal-api-fetch';
import { getInternalApiOrigin } from '@/lib/site-url';

vi.mock('next/headers', () => ({
  headers: vi.fn(async () => ({
    get(name: string) {
      if (name === 'cookie') return 'session=abc';
      return null;
    },
  })),
}));

describe('getInternalApiOrigin', () => {
  const originalSite = process.env.NEXT_PUBLIC_SITE_URL;
  const originalVercelEnv = process.env.VERCEL_ENV;
  const originalVercelUrl = process.env.VERCEL_URL;

  afterEach(() => {
    if (originalSite === undefined) delete process.env.NEXT_PUBLIC_SITE_URL;
    else process.env.NEXT_PUBLIC_SITE_URL = originalSite;
    if (originalVercelEnv === undefined) delete process.env.VERCEL_ENV;
    else process.env.VERCEL_ENV = originalVercelEnv;
    if (originalVercelUrl === undefined) delete process.env.VERCEL_URL;
    else process.env.VERCEL_URL = originalVercelUrl;
  });

  it('uses VERCEL_URL on preview even when NEXT_PUBLIC_SITE_URL is production', () => {
    process.env.NEXT_PUBLIC_SITE_URL = 'https://realmsrpg.com';
    process.env.VERCEL_ENV = 'preview';
    process.env.VERCEL_URL = 'realms-rpg-test-git-fix-abc.vercel.app';
    expect(getInternalApiOrigin()).toBe('https://realms-rpg-test-git-fix-abc.vercel.app');
  });

  it('uses the canonical site URL on production', () => {
    process.env.NEXT_PUBLIC_SITE_URL = 'https://realmsrpg.com';
    process.env.VERCEL_ENV = 'production';
    process.env.VERCEL_URL = 'realms-rpg-test-abc.vercel.app';
    expect(getInternalApiOrigin()).toBe('https://realmsrpg.com');
  });
});

describe('fetchInternalApi', () => {
  const originalSite = process.env.NEXT_PUBLIC_SITE_URL;
  const originalVercelEnv = process.env.VERCEL_ENV;
  const originalVercelUrl = process.env.VERCEL_URL;
  const originalBypass = process.env.VERCEL_AUTOMATION_BYPASS_SECRET;

  beforeEach(() => {
    vi.unstubAllGlobals();
  });

  afterEach(() => {
    if (originalSite === undefined) delete process.env.NEXT_PUBLIC_SITE_URL;
    else process.env.NEXT_PUBLIC_SITE_URL = originalSite;
    if (originalVercelEnv === undefined) delete process.env.VERCEL_ENV;
    else process.env.VERCEL_ENV = originalVercelEnv;
    if (originalVercelUrl === undefined) delete process.env.VERCEL_URL;
    else process.env.VERCEL_URL = originalVercelUrl;
    if (originalBypass === undefined) delete process.env.VERCEL_AUTOMATION_BYPASS_SECRET;
    else process.env.VERCEL_AUTOMATION_BYPASS_SECRET = originalBypass;
  });

  it('preflights against the preview deployment host, not canonical production', async () => {
    process.env.NEXT_PUBLIC_SITE_URL = 'https://realmsrpg.com';
    process.env.VERCEL_ENV = 'preview';
    process.env.VERCEL_URL = 'realms-rpg-test-preview.vercel.app';

    const fetchMock = vi.fn(async () => new Response('ok', { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);

    await fetchInternalApi('/api/characters/sheet-id');

    expect(fetchMock).toHaveBeenCalledWith(
      'https://realms-rpg-test-preview.vercel.app/api/characters/sheet-id',
      expect.objectContaining({
        headers: expect.objectContaining({ cookie: 'session=abc' }),
      }),
    );
  });

  it('does not follow hostile forwarded host headers', async () => {
    process.env.NEXT_PUBLIC_SITE_URL = 'http://localhost:3000';
    delete process.env.VERCEL_ENV;
    delete process.env.VERCEL_URL;

    vi.mocked(headers).mockResolvedValueOnce({
      get(name: string) {
        if (name === 'x-forwarded-host') return 'evil.example';
        if (name === 'host') return 'evil.example';
        if (name === 'cookie') return 'session=leak';
        return null;
      },
    } as Awaited<ReturnType<typeof headers>>);

    const fetchMock = vi.fn(async () => new Response('ok', { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);

    await fetchInternalApi('/api/campaigns/camp');

    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:3000/api/campaigns/camp',
      expect.any(Object),
    );
  });

  it('forwards the deployment protection bypass secret when configured', async () => {
    process.env.NEXT_PUBLIC_SITE_URL = 'http://localhost:3000';
    process.env.VERCEL_AUTOMATION_BYPASS_SECRET = 'bypass-secret';

    const fetchMock = vi.fn(async () => new Response('ok', { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);

    await fetchInternalApi('/api/campaigns/camp');

    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:3000/api/campaigns/camp',
      expect.objectContaining({
        headers: expect.objectContaining({
          'x-vercel-protection-bypass': 'bypass-secret',
        }),
      }),
    );
  });
});
