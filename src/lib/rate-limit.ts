/**
 * Rate Limiter
 * =============
 * Sliding-window rate limiter with optional Upstash Redis / Vercel KV backend
 * for consistent limits across Vercel serverless instances.
 *
 * When Redis/KV env vars are unset, falls back to per-instance in-memory limiting
 * (warned once per process — on serverless this is effectively "limit × instances").
 * On Redis errors the default is the same in-memory fallback; limiters created with
 * `failClosed: true` reject instead, so a configured-but-broken backend cannot
 * silently remove the limit from an auth/invite/upload path.
 *
 * Usage:
 *   import { standardLimiter, buildRateLimitKey } from '@/lib/rate-limit';
 *
 *   const { success } = await standardLimiter.check(
 *     buildRateLimitKey('my-action', { userId, ip })
 *   );
 *   if (!success) { return 429 or action error; }
 *
 * Env (optional — enables durable limits; see TASK-669):
 *   UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN
 *   — or Vercel KV: KV_REST_API_URL + KV_REST_API_TOKEN
 */

import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

interface RateLimitOptions {
  /** Time window in milliseconds */
  interval: number;
  /** Max requests per window */
  limit: number;
  /** Redis key namespace segment (required for durable backend) */
  prefix: string;
  /**
   * Reject the request when a durable backend is configured but its check fails,
   * instead of falling back to the per-instance window. Only affects the error
   * path — with no backend configured at all, in-memory limiting still applies.
   */
  failClosed?: boolean;
}

export interface RateLimitResult {
  success: boolean;
  remaining: number;
  reset: number;
}

/** Seconds until `reset` (min 1) for HTTP `Retry-After` response header. */
export function retryAfterSecondsFromReset(reset: number): string {
  return String(Math.max(1, Math.ceil((reset - Date.now()) / 1000)));
}

interface TokenBucket {
  timestamps: number[];
}

interface RateLimitKeyInput {
  userId?: string | null;
  ip?: string | null;
}

let sharedRedis: Redis | null | undefined;

function getSharedRedis(): Redis | null {
  if (sharedRedis !== undefined) return sharedRedis;

  const url = process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN;
  if (!url?.trim() || !token?.trim()) {
    sharedRedis = null;
    return null;
  }

  sharedRedis = new Redis({ url: url.trim(), token: token.trim() });
  return sharedRedis;
}

/** True when Upstash/Vercel KV credentials are configured. */
export function isDurableRateLimitEnabled(): boolean {
  return getSharedRedis() !== null;
}

let warnedMissingDurableBackend = false;

function warnMissingDurableBackendOnce(): void {
  if (warnedMissingDurableBackend) return;
  warnedMissingDurableBackend = true;
  console.warn(
    '[rate-limit] No durable backend configured (UPSTASH_REDIS_REST_URL/_TOKEN or KV_REST_API_URL/_TOKEN). ' +
      'Limits are per serverless instance only.'
  );
}

function msToDuration(ms: number): `${number} ms` | `${number} s` {
  if (ms >= 1000 && ms % 1000 === 0) {
    return `${ms / 1000} s`;
  }
  return `${ms} ms`;
}

function createMemoryLimiter({ interval, limit }: Pick<RateLimitOptions, 'interval' | 'limit'>) {
  const buckets = new Map<string, TokenBucket>();
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

/**
 * Create a rate limiter instance with a sliding window.
 * Uses Redis/KV when configured; otherwise in-memory per instance.
 */
export function rateLimit({ interval, limit, prefix, failClosed = false }: RateLimitOptions) {
  const memory = createMemoryLimiter({ interval, limit });
  let upstashLimiter: Ratelimit | null = null;

  function getUpstashLimiter(): Ratelimit | null {
    const redis = getSharedRedis();
    if (!redis) return null;
    if (!upstashLimiter) {
      upstashLimiter = new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(limit, msToDuration(interval)),
        prefix: `realms:rl:${prefix}`,
        analytics: false,
      });
    }
    return upstashLimiter;
  }

  return {
    async check(key: string): Promise<RateLimitResult> {
      const durable = getUpstashLimiter();
      if (!durable) {
        warnMissingDurableBackendOnce();
        return memory.check(key);
      }

      try {
        const result = await durable.limit(key);
        return {
          success: result.success,
          remaining: result.remaining,
          reset: result.reset,
        };
      } catch (err) {
        if (failClosed) {
          console.error(`[rate-limit] Redis check failed (${prefix}), failing closed:`, err);
          return { success: false, remaining: 0, reset: Date.now() + interval };
        }
        console.error(`[rate-limit] Redis check failed (${prefix}), using in-memory fallback:`, err);
        return memory.check(key);
      }
    },
  };
}

/**
 * Extract the most useful client IP value from request headers.
 * Prefers `x-real-ip` (set by the platform), then the *last* `x-forwarded-for`
 * entry: entries a client prepends cannot displace the hop the edge appended.
 */
export function resolveClientIp(headers: Headers): string {
  const realIp = headers.get('x-real-ip')?.trim();
  if (realIp) return realIp.slice(0, 64);

  const forwardedHops = (headers.get('x-forwarded-for') ?? '')
    .split(',')
    .map((hop) => hop.trim())
    .filter(Boolean);
  const raw = forwardedHops[forwardedHops.length - 1] ?? 'unknown';
  return raw.slice(0, 64);
}

/**
 * Build a stable limiter key. Uses authenticated user when available, else IP.
 */
export function buildRateLimitKey(prefix: string, input: RateLimitKeyInput): string {
  const userId = input.userId?.trim();
  if (userId) {
    return `${prefix}:uid:${userId}`;
  }
  const ip = input.ip?.trim() || 'unknown';
  return `${prefix}:ip:${ip}`;
}

// =============================================================================
// Pre-configured limiters for different endpoint types
// =============================================================================

/** Standard mutation limiter: 30 requests per minute */
export const standardLimiter = rateLimit({ interval: 60_000, limit: 30, prefix: 'standard' });

/**
 * Strict limiter for sensitive operations: 10 per minute. Fails closed — it guards
 * the username-existence oracle and admin role writes, where a configured-but-broken
 * backend removing the limit is worse than rejecting the request.
 */
export const strictLimiter = rateLimit({
  interval: 60_000,
  limit: 10,
  prefix: 'strict',
  failClosed: true,
});

/** Invite code lookup / join: 5 per minute (prevent brute-force). Fails closed. */
export const inviteCodeLimiter = rateLimit({
  interval: 60_000,
  limit: 5,
  prefix: 'invite',
  failClosed: true,
});

/** Auth-adjacent actions (resend, forgot-username stub): 5 per minute. Fails closed. */
export const authActionLimiter = rateLimit({
  interval: 60_000,
  limit: 5,
  prefix: 'auth',
  failClosed: true,
});

/** Upload limiter: 12 uploads per minute. Fails closed (storage abuse is billable). */
export const uploadLimiter = rateLimit({
  interval: 60_000,
  limit: 12,
  prefix: 'upload',
  failClosed: true,
});
