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

/** Index the public site only on Vercel production. Preview, local, and CI stay noindex. */
export function isProductionIndexingEnabled(): boolean {
  return process.env.VERCEL_ENV === 'production';
}
