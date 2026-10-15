/**
 * Process-wide memo for public Supabase reads (static generation / warm serverless).
 * React `cache()` and per-request clients do not dedupe whole-table reads across pages.
 */

const inflight = new Map<string, Promise<unknown>>();

export function resetMemoizedPublicReadsForTests(): void {
  inflight.clear();
}

export function memoizedPublicRead<T>(cacheKey: string, loader: () => Promise<T>): Promise<T> {
  const existing = inflight.get(cacheKey);
  if (existing) return existing as Promise<T>;
  const pending = loader();
  inflight.set(cacheKey, pending);
  return pending;
}
