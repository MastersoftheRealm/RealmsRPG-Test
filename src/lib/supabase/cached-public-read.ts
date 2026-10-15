/**
 * Next.js Data Cache for cookie-less public Supabase reads (ADR-0021).
 * Prefer `unstable_cache` + tags over ad-hoc module singletons so ISR revalidate
 * and `revalidateTag` stay aligned with page `revalidate`.
 */

import { unstable_cache } from 'next/cache';

/** Matches `/codex/[collection]/[slug]` `export const revalidate`. */
export const CODEX_PUBLIC_ISR_SECONDS = 3600;

export function readCachedPublicData<T>(
  keyParts: string[],
  tags: string[],
  revalidateSeconds: number,
  loader: () => Promise<T>,
): Promise<T> {
  return unstable_cache(loader, keyParts, {
    revalidate: revalidateSeconds,
    tags,
  })();
}
