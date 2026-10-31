/**
 * Next.js Data Cache for cookie-less public Supabase reads (ADR-0021).
 * Prefer `unstable_cache` + tags over ad-hoc module singletons so ISR revalidate
 * and `revalidateTag` stay aligned with page `revalidate`.
 */

import { unstable_cache } from 'next/cache';

/** Shared ISR window for public codex / rules Data Cache reads. */
export const CODEX_PUBLIC_ISR_SECONDS = 3600;

/** Thrown inside `unstable_cache` loaders so failed/empty reads are not persisted (86e3rb7ca). */
class TransientPublicReadError<T = unknown> extends Error {
  readonly value: T;

  constructor(value: T) {
    super('Transient public read — do not cache');
    this.name = 'TransientPublicReadError';
    this.value = value;
  }
}

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

/**
 * Like `readCachedPublicData`, but when `shouldCache` is false the loader result is still
 * returned to the caller and is not written to the Data Cache (related: 86e3rb7ca).
 */
export async function readCachedPublicDataWhenValid<T>(
  keyParts: string[],
  tags: string[],
  revalidateSeconds: number,
  loader: () => Promise<T>,
  shouldCache: (value: T) => boolean,
): Promise<T> {
  try {
    return await readCachedPublicData(keyParts, tags, revalidateSeconds, async () => {
      const value = await loader();
      if (!shouldCache(value)) {
        throw new TransientPublicReadError(value);
      }
      return value;
    });
  } catch (error) {
    if (error instanceof TransientPublicReadError) {
      return error.value;
    }
    throw error;
  }
}
