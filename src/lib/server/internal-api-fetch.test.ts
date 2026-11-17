import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { headers } from 'next/headers';
import { fetchInternalApi } from '@/lib/server/internal-api-fetch';
import { resolveInternalApiOrigin } from '@/lib/site-url';

vi.mock('next/headers', () => ({
  headers: vi.fn(async () => ({
    get(name: string) {
      if (name === 'cookie') return 'session=abc';
      return null;
    },
  })),
}));

function mockHeaders(values: Record<string, string>) {
  return {
    get(name: string) {
      return values[name.toLowerCase()] ?? null;
    },
  };
}

describe('resolveInternalApiOrigin', () => {
  const originalSite = process.env.NEXT_PUBLIC_SITE_URL;
  const originalVercelEnv = process.env.VERCEL_ENV;
  const originalVercelUrl = process.env.VERCEL_URL;
  const originalBranchUrl = process.env.VERCEL_BRANCH_URL;

  afterEach(() => {
    if (originalSite === undefined) delete process.env.NEXT_PUBLIC_SITE_URL;
    else process.env.NEXT_PUBLIC_SITE_URL = originalSite;
    if (originalVercelEnv === undefined) delete process.env.VERCEL_ENV;
    else process.env.VERCEL_ENV = originalVercelEnv;
    if (originalVercelUrl === undefined) delete process.env.VERCEL_URL;
    else process.env.VERCEL_URL = originalVercelUrl;
    if (originalBranchUrl === undefined) delete process.env.VERCEL_BRANCH_URL;
    else process.env.VERCEL_BRANCH_URL = originalBranchUrl;
  });

  it('uses the branch URL when the viewer opened that host on preview', () => {
    process.env.NEXT_PUBLIC_SITE_URL = 'https://realmsrpg.com';
    process.env.VERCEL_ENV = 'preview';
    process.env.VERCEL_URL = 'realms-rpg-test-abc123.vercel.app';
    process.env.VERCEL_BRANCH_URL = 'realms-rpg-test-git-fix-branch.vercel.app';

    expect(
      resolveInternalApiOrigin(
        mockHeaders({
          host: 'realms-rpg-test-git-fix-branch.vercel.app',
          'x-forwarded-proto': 'https',
        }),
      ),
    ).toBe('https://realms-rpg-test-git-fix-branch.vercel.app');
  });

  it('ignores a malicious x-forwarded-proto and keeps the allowlisted host', () => {
    process.env.NEXT_PUBLIC_SITE_URL = 'https://realmsrpg.com';
    process.env.VERCEL_ENV = 'preview';
    process.env.VERCEL_URL = 'realms-rpg-test-preview.vercel.app';
    process.env.VERCEL_BRANCH_URL = 'realms-rpg-test-git-fix-branch.vercel.app';

    expect(
      resolveInternalApiOrigin(
        mockHeaders({
          host: 'realms-rpg-test-git-fix-branch.vercel.app',
          'x-forwarded-proto': 'https://evil.example',
        }),
      ),
    ).toBe('https://realms-rpg-test-git-fix-branch.vercel.app');
  });

  it('falls back to VERCEL_URL when request host is not allowlisted', () => {
    process.env.NEXT_PUBLIC_SITE_URL = 'https://realmsrpg.com';
    process.env.VERCEL_ENV = 'preview';
    process.env.VERCEL_URL = 'realms-rpg-test-preview.vercel.app';
    process.env.VERCEL_BRANCH_URL = 'realms-rpg-test-git-fix-branch.vercel.app';

    expect(
      resolveInternalApiOrigin(
        mockHeaders({
          host: 'realmsrpg.com',
        }),
      ),
    ).toBe('https://realms-rpg-test-preview.vercel.app');
  });

  it('uses the canonical site URL on production regardless of headers', () => {
    process.env.NEXT_PUBLIC_SITE_URL = 'https://realmsrpg.com';
    process.env.VERCEL_ENV = 'production';
    process.env.VERCEL_URL = 'realms-rpg-test-abc.vercel.app';

    expect(
      resolveInternalApiOrigin(
        mockHeaders({
          host: 'evil.example',
        }),
      ),
    ).toBe('https://realmsrpg.com');
  });
});

describe('fetchInternalApi', () => {
  const originalSite = process.env.NEXT_PUBLIC_SITE_URL;
  const originalVercelEnv = process.env.VERCEL_ENV;
  const originalVercelUrl = process.env.VERCEL_URL;
  const originalBranchUrl = process.env.VERCEL_BRANCH_URL;
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
    if (originalBranchUrl === undefined) delete process.env.VERCEL_BRANCH_URL;
    else process.env.VERCEL_BRANCH_URL = originalBranchUrl;
    if (originalBypass === undefined) delete process.env.VERCEL_AUTOMATION_BYPASS_SECRET;
    else process.env.VERCEL_AUTOMATION_BYPASS_SECRET = originalBypass;
  });

  it('preflights against the branch host the viewer used', async () => {
    process.env.NEXT_PUBLIC_SITE_URL = 'https://realmsrpg.com';
    process.env.VERCEL_ENV = 'preview';
    process.env.VERCEL_URL = 'realms-rpg-test-preview.vercel.app';
    process.env.VERCEL_BRANCH_URL = 'realms-rpg-test-git-fix-branch.vercel.app';

    vi.mocked(headers).mockResolvedValueOnce(
      mockHeaders({
        host: 'realms-rpg-test-git-fix-branch.vercel.app',
        cookie: 'session=abc',
        'x-forwarded-proto': 'https',
      }) as Awaited<ReturnType<typeof headers>>,
    );

    const fetchMock = vi.fn(async () => new Response('ok', { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);

    await fetchInternalApi('/api/characters/sheet-id');

    expect(fetchMock).toHaveBeenCalledWith(
      'https://realms-rpg-test-git-fix-branch.vercel.app/api/characters/sheet-id',
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
