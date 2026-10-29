import nextConfig from '../../../next.config';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { buildContentSecurityPolicy } from './content-security-policy';

type HeaderEntry = { key: string; value: string };

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

  it('matches buildContentSecurityPolicy for production on every route (site-wide)', async () => {
    const expected = buildContentSecurityPolicy('production');
    const csp = await servedContentSecurityPolicy('production');
    expect(csp).toBe(expected);
  });

  it('matches buildContentSecurityPolicy for development on every route', async () => {
    const expected = buildContentSecurityPolicy('development');
    const csp = await servedContentSecurityPolicy('development');
    expect(csp).toBe(expected);
  });
});
