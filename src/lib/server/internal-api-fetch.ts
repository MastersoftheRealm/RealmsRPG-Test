import { headers } from 'next/headers';
import { resolveInternalApiOrigin } from '@/lib/site-url';

/**
 * Same-deployment API fetch from a Server Component, forwarding session cookies to an
 * allowlisted origin only (viewer host on preview, canonical on production).
 */
export async function fetchInternalApi(path: string): Promise<Response> {
  const headerList = await headers();
  const origin = resolveInternalApiOrigin(headerList);
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const url = `${origin}${normalizedPath}`;
  const cookie = headerList.get('cookie') ?? '';
  const requestHeaders: Record<string, string> = {
    cookie,
    accept: 'application/json',
  };
  const protectionBypass = process.env.VERCEL_AUTOMATION_BYPASS_SECRET?.trim();
  if (protectionBypass) {
    requestHeaders['x-vercel-protection-bypass'] = protectionBypass;
  }
  return fetch(url, {
    headers: requestHeaders,
    cache: 'no-store',
  });
}
