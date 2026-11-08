import { headers } from 'next/headers';
import { getCanonicalSiteUrl } from '@/lib/site-url';

/**
 * Same-origin API fetch from a Server Component, forwarding session cookies only to the
 * configured canonical origin (never header-derived host/proto).
 */
export async function fetchInternalApi(path: string): Promise<Response> {
  const headerList = await headers();
  const canonicalOrigin = getCanonicalSiteUrl();
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const url = `${canonicalOrigin}${normalizedPath}`;
  const cookie = headerList.get('cookie') ?? '';
  return fetch(url, {
    headers: {
      cookie,
      accept: 'application/json',
    },
    cache: 'no-store',
  });
}
