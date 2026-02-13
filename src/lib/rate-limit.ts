/**
 * Rate Limiter
 * =============
 * Simple in-memory sliding-window rate limiter for API routes.
 * Works with Vercel serverless (per-instance memory).
 *
 * For production at scale, replace with @upstash/ratelimit + Redis.
 * For this app's scale (personal TTRPG tool), in-memory is fine.
 *
 * Usage:
 *   import { rateLimit } from '@/lib/rate-limit';
 *
 *   const limiter = rateLimit({ interval: 60_000, limit: 30 });
 *
 *   export async function POST(request: NextRequest) {
 *     const ip = request.headers.get('x-forwarded-for') ?? 'unknown';
 *     const { success, remaining } = limiter.check(ip);
 *     if (!success) {
 *       return NextResponse.json({ error: 'Too many requests' }, {
 *         status: 429,
 *         headers: { 'Retry-After': '60' },
 *       });
 *     }
 *     // ... handle request
 *   }
 */

interface RateLimitOptions {
  /** Time window in milliseconds */
  interval: number;
  /** Max requests per window */
  limit: number;
}

interface RateLimitResult {
  success: boolean;
  remaining: number;
  reset: number;
}

interface TokenBucket {
  timestamps: number[];
}

/**
 * Create a rate limiter instance with a sliding window.
 */
export function rateLimit({ interval, limit }: RateLimitOptions) {
  const buckets = new Map<string, TokenBucket>();

  // Periodically clean expired entries to prevent memory leaks
  const CLEANUP_INTERVAL = interval * 2;
  let lastCleanup = Date.now();

  function cleanup() {
    const now = Date.now();
    if (now - lastCleanup < CLEANUP_INTERVAL) return;
    lastCleanup = now;

    const cutoff = now - interval;
    for (const [key, bucket] of buckets) {
      bucket.timestamps = bucket.timestamps.filter((t) => t > cutoff);
      if (bucket.timestamps.length === 0) {
        buckets.delete(key);
      }
    }
  }

  return {
    check(key: string): RateLimitResult {
      cleanup();

      const now = Date.now();
      const cutoff = now - interval;

      let bucket = buckets.get(key);
      if (!bucket) {
        bucket = { timestamps: [] };
        buckets.set(key, bucket);
      }

      // Remove timestamps outside window
      bucket.timestamps = bucket.timestamps.filter((t) => t > cutoff);

      if (bucket.timestamps.length >= limit) {
        const oldestInWindow = bucket.timestamps[0];
        return {
          success: false,
          remaining: 0,
          reset: oldestInWindow + interval,
        };
      }

      bucket.timestamps.push(now);
      return {
        success: true,
        remaining: limit - bucket.timestamps.length,
        reset: now + interval,
      };
    },
  };
}

// =============================================================================
// Pre-configured limiters for different endpoint types
// =============================================================================

/** Standard mutation limiter: 30 requests per minute */
export const standardLimiter = rateLimit({ interval: 60_000, limit: 30 });

/** Strict limiter for sensitive operations: 10 per minute */
export const strictLimiter = rateLimit({ interval: 60_000, limit: 10 });

/** Invite code lookup: 5 per minute (prevent brute-force) */
export const inviteCodeLimiter = rateLimit({ interval: 60_000, limit: 5 });
