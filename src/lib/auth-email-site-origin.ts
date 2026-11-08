import { SITE_URL } from '@/lib/constants/copy/shared-copy';

const LOCAL_DEV_ORIGIN = 'http://localhost:3000';

/**
 * Origin for Supabase email links (confirm, reset). Prefers `NEXT_PUBLIC_SITE_URL`;
 * localhost only outside production; in production without env, uses canonical SITE_URL
 * (never forwarded Host / x-forwarded-*).
 */
export function resolveAuthEmailSiteOrigin(requestHeaders: Headers): string | null {
  void requestHeaders;
  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/$/, '');
  if (fromEnv) return fromEnv;

  if (process.env.NODE_ENV !== 'production') {
    return LOCAL_DEV_ORIGIN;
  }

  return SITE_URL.replace(/\/$/, '');
}
