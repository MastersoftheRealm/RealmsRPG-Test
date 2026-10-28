import nextConfig from '../../../next.config';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { TURNSTILE_CSP_ORIGIN } from './content-security-policy';

type HeaderEntry = { key: string; value: string };

function parseDirectives(csp: string): Map<string, string[]> {
  const directives = new Map<string, string[]>();
  for (const part of csp.split('; ')) {
    const space = part.indexOf(' ');
    if (space === -1) continue;
    const name = part.slice(0, space);
    const sources = part
      .slice(space + 1)
      .split(' ')
      .filter(Boolean);
    directives.set(name, sources);
  }
  return directives;
}

async function servedContentSecurityPolicy(nodeEnv: string): Promise<string> {
  vi.stubEnv('NODE_ENV', nodeEnv);
  const headerGroups = await nextConfig.headers?.();
  if (!headerGroups) throw new Error('next.config headers() is missing');

  const catchAll = headerGroups.find((group) => group.source === '/:path*');
  if (!catchAll) throw new Error('No /:path* header group in next.config');

  const cspHeader = (catchAll.headers as HeaderEntry[]).find(
    (header) => header.key === 'Content-Security-Policy',
  );
  if (!cspHeader?.value) throw new Error('Content-Security-Policy header missing on /:path*');
  return cspHeader.value;
}

describe('served Content-Security-Policy (next.config headers)', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('allows Cloudflare Turnstile on script-src, frame-src, and connect-src in production', async () => {
    const csp = await servedContentSecurityPolicy('production');
    const directives = parseDirectives(csp);

    for (const directive of ['script-src', 'frame-src', 'connect-src'] as const) {
      const sources = directives.get(directive);
      expect(sources, `${directive} missing`).toBeDefined();
      expect(sources).toContain(TURNSTILE_CSP_ORIGIN);
    }

    expect(directives.get('script-src')).toEqual([
      "'self'",
      "'unsafe-inline'",
      'https://vercel.live',
      'https://va.vercel-scripts.com',
      TURNSTILE_CSP_ORIGIN,
    ]);
    expect(directives.get('frame-src')).toEqual([
      "'self'",
      'https://vercel.live',
      TURNSTILE_CSP_ORIGIN,
    ]);
    expect(directives.get('object-src')).toEqual(["'none'"]);
    expect(directives.get('default-src')).toEqual(["'self'"]);
    expect(directives.get('img-src')).toEqual(["'self'", 'data:', 'blob:', 'https:']);
  });

  it('includes Turnstile in development without dropping existing connect-src hosts', async () => {
    const csp = await servedContentSecurityPolicy('development');
    const connect = parseDirectives(csp).get('connect-src');
    expect(connect).toContain(TURNSTILE_CSP_ORIGIN);
    expect(connect).toContain('wss://*.supabase.co');
    expect(connect).toContain('ws://localhost:*');
  });
});
