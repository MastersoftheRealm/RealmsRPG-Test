/**
 * CDN cache headers for anonymous public catalog APIs (/api/codex, /api/official).
 *
 * Public responses are built with the cookie-less client only. The CDN cache key is the
 * request URL, so `?collection=` and any other query string stay separate entries.
 * `includeUnlisted=1` and `?debug=1` never use the public header. Do not add `Vary: Cookie`:
 * that would store a copy per cookie jar, including a signed-in response.
 */

import type { NextResponse } from 'next/server';
import type { CodexPayload, CodexPayloadKey } from '@/types/codex';

/** Response header Vercel uses to purge CDN entries by tag on `updateTag` / `revalidateTag`. */
export const VERCEL_CACHE_TAG_HEADER = 'Vercel-Cache-Tag';

/**
 * Browsers revalidate (`max-age=0`). Shared caches keep a fresh copy for 5 minutes, then may
 * serve one stale response while refreshing (`stale-while-revalidate`). Used by `/api/official`.
 */
export const PUBLIC_CDN_CACHE_CONTROL =
  'public, max-age=0, s-maxage=300, stale-while-revalidate=3600';

/** Listed-only `GET /api/codex` CDN header — no stale-while-revalidate. */
export const CODEX_PUBLIC_CDN_CACHE_CONTROL = 'public, max-age=0, s-maxage=300';

export const PRIVATE_MUST_REVALIDATE_CACHE_CONTROL = 'private, max-age=0, must-revalidate';

export const PRIVATE_NO_STORE_CACHE_CONTROL = 'private, no-store';

function recordIsUnlisted(value: unknown): boolean {
  if (!value || typeof value !== 'object') return false;
  const record = value as Record<string, unknown>;
  return record.catalogListing === 'unlisted' || record.catalog_listing === 'unlisted';
}

export function codexResponseMayUsePublicCdn(
  keys: ReadonlySet<CodexPayloadKey>,
  body: Partial<CodexPayload>,
): boolean {
  if (keys.size === 0) return false;
  let sawContent = false;
  for (const key of keys) {
    const value = body[key];
    if (key === 'coreRules') {
      if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
      if (Object.keys(value).length === 0) return false;
      sawContent = true;
      continue;
    }
    if (!Array.isArray(value)) return false;
    if (value.some(recordIsUnlisted)) return false;
    if (value.length === 0) {
      if (keys.size === 1) return false;
      continue;
    }
    sawContent = true;
  }
  return sawContent;
}

export function officialListMayUsePublicCdn(items: unknown[]): boolean {
  return items.length > 0 && !items.some(recordIsUnlisted);
}

function joinVercelCacheTags(tags: readonly string[]): string | undefined {
  const unique = [...new Set(tags.filter((tag) => tag.length > 0 && tag.length <= 256))];
  return unique.length > 0 ? unique.join(',') : undefined;
}

export function withVercelCacheTags(response: NextResponse, tags: readonly string[]): NextResponse {
  const joined = joinVercelCacheTags(tags);
  if (joined) {
    response.headers.set(VERCEL_CACHE_TAG_HEADER, joined);
  }
  return response;
}
