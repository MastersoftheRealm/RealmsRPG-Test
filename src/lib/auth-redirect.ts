import { sanitizeRedirectPath } from '@/lib/safe-redirect';

function parseForwardedHost(value: string | null | undefined): string | null {
  const trimmed = value?.trim().toLowerCase();
  if (!trimmed) return null;
  const first = trimmed.split(',')[0]?.trim();
  return first || null;
}

function hostFromSiteUrl(envValue: string | undefined | null): string | null {
  if (!envValue?.trim()) return null;
  try {
    return new URL(envValue.trim()).host.toLowerCase();
  } catch {
    return null;
  }
}

/** Host header values that may be used as the redirect origin. */
export function collectAllowedRedirectHosts(request: Request): Set<string> {
  const hosts = new Set<string>();
  const requestUrl = new URL(request.url);
  if (requestUrl.host) hosts.add(requestUrl.host.toLowerCase());

  const hostHeader = parseForwardedHost(request.headers.get('host'));
  if (hostHeader) hosts.add(hostHeader);

  const configured = hostFromSiteUrl(process.env.NEXT_PUBLIC_SITE_URL);
  if (configured) hosts.add(configured);

  const vercelRaw = process.env.VERCEL_URL?.trim();
  if (vercelRaw) {
    const vercelHost = hostFromSiteUrl(
      vercelRaw.includes('://') ? vercelRaw : `https://${vercelRaw}`,
    );
    if (vercelHost) hosts.add(vercelHost);
  }

  return hosts;
}

/**
 * Origin for post-auth redirects. Never builds a URL solely from `x-forwarded-host`
 * unless that host is in {@link collectAllowedRedirectHosts}.
 */
export function resolveTrustedRedirectOrigin(request: Request): string {
  const { origin } = new URL(request.url);
  if (process.env.NODE_ENV === 'development') {
    return origin;
  }

  const forwardedHost = parseForwardedHost(request.headers.get('x-forwarded-host'));
  if (forwardedHost && collectAllowedRedirectHosts(request).has(forwardedHost)) {
    const proto =
      request.headers.get('x-forwarded-proto')?.split(',')[0]?.trim().toLowerCase() || 'https';
    return `${proto}://${forwardedHost}`;
  }

  return origin;
}

/** Canonical post-auth origin from `NEXT_PUBLIC_SITE_URL` (not forwarded Host/proto). */
export function resolveCanonicalRedirectOrigin(fallbackRequest?: Request): string {
  const site = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (site) {
    try {
      return new URL(site).origin;
    } catch {
      // fall through
    }
  }
  if (fallbackRequest) {
    return resolveTrustedRedirectOrigin(fallbackRequest);
  }
  return 'http://localhost:3000';
}

export function buildCanonicalAuthRedirectUrl(
  path: string,
  options?: { sanitizeUserRedirect?: boolean | undefined },
): string {
  const safePath =
    options?.sanitizeUserRedirect === false
      ? path.trim().startsWith('/') && !path.includes('://')
        ? path.trim()
        : '/'
      : sanitizeRedirectPath(path);
  return `${resolveCanonicalRedirectOrigin()}${safePath}`;
}

export function buildAuthRedirectUrl(
  request: Request,
  path: string,
  options?: { sanitizeUserRedirect?: boolean | undefined },
): string {
  const safePath =
    options?.sanitizeUserRedirect === false
      ? path.trim().startsWith('/') && !path.includes('://')
        ? path.trim()
        : '/'
      : sanitizeRedirectPath(path);
  return `${resolveTrustedRedirectOrigin(request)}${safePath}`;
}
