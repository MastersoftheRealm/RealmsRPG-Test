const LOCAL_DEV_ORIGIN = 'http://localhost:3000';

/**
 * Origin for Supabase email links (confirm, reset). Prefers `NEXT_PUBLIC_SITE_URL`;
 * localhost only outside production; in production derives from trusted request headers.
 */
export function resolveAuthEmailSiteOrigin(requestHeaders: Headers): string | null {
  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/$/, '');
  if (fromEnv) return fromEnv;

  if (process.env.NODE_ENV !== 'production') {
    return LOCAL_DEV_ORIGIN;
  }

  const forwardedHost = requestHeaders.get('x-forwarded-host')?.split(',')[0]?.trim();
  const host = forwardedHost || requestHeaders.get('host')?.trim();
  if (!host) {
    console.error(
      '[auth] Missing NEXT_PUBLIC_SITE_URL and no Host header for email redirect origin',
    );
    return null;
  }

  const proto =
    requestHeaders.get('x-forwarded-proto')?.split(',')[0]?.trim().toLowerCase() || 'https';
  return `${proto}://${host}`.replace(/\/$/, '');
}
