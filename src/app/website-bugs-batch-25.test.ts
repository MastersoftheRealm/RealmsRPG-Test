import { readFileSync } from 'node:fs';
import path from 'node:path';
import type { Redirect } from 'next/dist/lib/load-custom-routes';
import { prepareDestination } from 'next/dist/shared/lib/router/utils/prepare-destination';
import { getPathMatch } from 'next/dist/shared/lib/router/utils/path-match';
import { describe, expect, it } from 'vitest';
import nextConfig from '../../next.config';

const nextConfigSource = readFileSync(path.join(process.cwd(), 'next.config.ts'), 'utf8');

/** Mirrors Next.js config redirect handling (`appendParamsToQuery: false`). */
function resolveConfigRedirect(
  route: Pick<Redirect, 'destination'>,
  pathname: string,
  query: Record<string, string>,
) {
  const { parsedDestination } = prepareDestination({
    appendParamsToQuery: false,
    destination: route.destination,
    params: {},
    query,
  });
  const mergedQuery = parsedDestination.query ?? {};
  const search = new URLSearchParams(
    Object.entries(mergedQuery).flatMap(([key, value]) =>
      value === undefined ? [] : [[key, String(value)]],
    ),
  ).toString();
  return {
    pathname: parsedDestination.pathname,
    search: search ? `?${search}` : '',
  };
}

async function loadLegacyRedirects(): Promise<Redirect[]> {
  const redirects = nextConfig.redirects;
  if (!redirects) {
    throw new Error('next.config redirects() is missing');
  }
  return redirects();
}

describe('website bugs batch 25 — Search Console redirect aliases (1dfe8wf24w1)', () => {
  it('uses permanent redirects for legacy /browse and /signup aliases', () => {
    expect(nextConfigSource).toMatch(
      /source:\s*'\/browse',\s*destination:\s*'\/library',\s*permanent:\s*true/,
    );
    expect(nextConfigSource).toMatch(
      /source:\s*'\/signup',\s*destination:\s*'\/register',\s*permanent:\s*true/,
    );
  });

  it('passes request query strings through /browse and /signup redirects', async () => {
    const routes = await loadLegacyRedirects();
    const browse = routes.find((route) => route.source === '/browse');
    const signup = routes.find((route) => route.source === '/signup');
    expect(browse?.destination).toBe('/library');
    expect(signup?.destination).toBe('/register');

    const query = { redirect: '/characters', mode: 'public' };
    expect(resolveConfigRedirect(browse!, '/browse', query)).toEqual({
      pathname: '/library',
      search: '?redirect=%2Fcharacters&mode=public',
    });
    expect(resolveConfigRedirect(signup!, '/signup', query)).toEqual({
      pathname: '/register',
      search: '?redirect=%2Fcharacters&mode=public',
    });
  });

  it('does not redirect live destination pages configured in next.config', async () => {
    const routes = await loadLegacyRedirects();
    const matchers = routes.map((route) => getPathMatch(route.source));

    const liveRoutes = [
      '/library',
      '/register',
      '/login',
      '/encounters',
      '/crafting',
      '/characters/new',
    ];

    for (const livePath of liveRoutes) {
      const matched = matchers.some((matcher) => matcher(livePath));
      expect(matched, livePath).toBe(false);
    }
  });
});
