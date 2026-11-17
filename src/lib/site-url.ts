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

function hostFromEnvUrl(envValue: string | undefined | null): string | null {
  const trimmed = envValue?.trim();
  if (!trimmed) return null;
  const withProto = trimmed.includes('://') ? trimmed : `https://${trimmed}`;
  try {
    return new URL(withProto).host.toLowerCase();
  } catch {
    return null;
  }
}

function originFromEnvUrl(envValue: string | undefined | null): string | null {
  const trimmed = envValue?.trim();
  if (!trimmed) return null;
  const withProto = trimmed.includes('://') ? trimmed : `https://${trimmed}`;
  try {
    return new URL(withProto).origin;
  } catch {
    return null;
  }
}

function parseForwardedHost(value: string | null | undefined): string | null {
  const trimmed = value?.trim().toLowerCase();
  if (!trimmed) return null;
  return trimmed.split(',')[0]?.trim() || null;
}

/** Hosts a server-side API preflight may target from an incoming request. */
function collectInternalApiRequestHosts(): Set<string> {
  const hosts = new Set<string>();
  const vercelEnv = process.env.VERCEL_ENV;
  if (vercelEnv === 'production') {
    const canonicalHost = hostFromEnvUrl(getCanonicalSiteUrl());
    if (canonicalHost) hosts.add(canonicalHost);
    return hosts;
  }
  if (!vercelEnv || vercelEnv === 'development') {
    const localHost = hostFromEnvUrl(getCanonicalSiteUrl());
    if (localHost) hosts.add(localHost);
  }
  for (const value of [process.env.VERCEL_URL, process.env.VERCEL_BRANCH_URL]) {
    const host = hostFromEnvUrl(value);
    if (host) hosts.add(host);
  }
  return hosts;
}

/**
 * Origin for server-side fetches to this app's own API routes (access preflight).
 * Production uses canonical only. Preview prefers the viewer's allowlisted host (branch or
 * deployment URL) so Standard Protection sees same-origin cookies; falls back to VERCEL_URL.
 */
export function resolveInternalApiOrigin(headerList: { get(name: string): string | null }): string {
  if (process.env.VERCEL_ENV === 'production') {
    return getCanonicalSiteUrl();
  }

  const allowed = collectInternalApiRequestHosts();
  for (const candidate of [
    parseForwardedHost(headerList.get('x-forwarded-host')),
    parseForwardedHost(headerList.get('host')),
  ]) {
    if (candidate && allowed.has(candidate)) {
      const protoRaw = headerList.get('x-forwarded-proto')?.split(',')[0]?.trim().toLowerCase();
      const proto = protoRaw === 'http' || protoRaw === 'https' ? protoRaw : 'https';
      return `${proto}://${candidate}`;
    }
  }

  const vercelOrigin = originFromEnvUrl(process.env.VERCEL_URL);
  if (vercelOrigin) return vercelOrigin;

  return getCanonicalSiteUrl();
}

/** Index the public site only on Vercel production. Preview, local, and CI stay noindex. */
export function isProductionIndexingEnabled(): boolean {
  return process.env.VERCEL_ENV === 'production';
}
