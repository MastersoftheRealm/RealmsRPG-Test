import { SITE_URL } from '@/lib/constants/copy/shared-copy';

/** Production or preview origin without a trailing slash. */
export function getCanonicalSiteUrl(): string {
  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/$/, '');
  if (fromEnv) return fromEnv;
  return SITE_URL;
}

export function getCanonicalSiteUrlObject(): URL {
  try {
    return new URL(getCanonicalSiteUrl());
  } catch {
    return new URL(SITE_URL);
  }
}

/**
 * Origin for server-side fetches to this app's own API routes (access preflight).
 * Uses the deployment hostname on Vercel preview so preflight does not call production.
 * Never derived from request headers (see internal-api-fetch).
 */
export function getInternalApiOrigin(): string {
  if (process.env.VERCEL_ENV === 'production') {
    return getCanonicalSiteUrl();
  }
  const vercelRaw = process.env.VERCEL_URL?.trim();
  if (vercelRaw) {
    const withProto = vercelRaw.includes('://') ? vercelRaw : `https://${vercelRaw}`;
    return withProto.replace(/\/$/, '');
  }
  return getCanonicalSiteUrl();
}

/** Index the public site only on Vercel production. Preview, local, and CI stay noindex. */
export function isProductionIndexingEnabled(): boolean {
  return process.env.VERCEL_ENV === 'production';
}
