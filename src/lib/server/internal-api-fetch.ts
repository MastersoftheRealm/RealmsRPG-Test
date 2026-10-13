import { headers } from 'next/headers';

/**
 * Same-origin API fetch from a Server Component, forwarding session cookies.
 */
export async function fetchInternalApi(path: string): Promise<Response> {
  const headerList = await headers();
  const host = headerList.get('x-forwarded-host') ?? headerList.get('host');
  if (!host) {
    throw new Error('Missing host header for internal API fetch');
  }
  const proto = headerList.get('x-forwarded-proto') ?? 'http';
  const cookie = headerList.get('cookie') ?? '';
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const url = `${proto}://${host}${normalizedPath}`;
  return fetch(url, {
    headers: {
      cookie,
      accept: 'application/json',
    },
    cache: 'no-store',
  });
}
