import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mockLimit = vi.fn();

vi.mock('@upstash/ratelimit', () => ({
  Ratelimit: Object.assign(
    vi.fn(function MockRatelimit() {
      return { limit: mockLimit };
    }),
    { slidingWindow: vi.fn(() => ({})) }
  ),
}));

vi.mock('@upstash/redis', () => ({
  Redis: vi.fn(function MockRedis() {
    return {};
  }),
}));

const REDIS_ENV_KEYS = [
  'UPSTASH_REDIS_REST_URL',
  'UPSTASH_REDIS_REST_TOKEN',
  'KV_REST_API_URL',
  'KV_REST_API_TOKEN',
] as const;

describe('rate-limit', () => {
  const envSnapshot = { ...process.env };

  beforeEach(() => {
    vi.resetModules();
    mockLimit.mockReset();
    process.env = { ...envSnapshot };
    for (const key of REDIS_ENV_KEYS) {
      delete process.env[key];
    }
  });

  afterEach(() => {
    process.env = envSnapshot;
  });

  it('isDurableRateLimitEnabled returns false when Redis env is unset', async () => {
    const { isDurableRateLimitEnabled } = await import('./rate-limit');
    expect(isDurableRateLimitEnabled()).toBe(false);
  });

  it('isDurableRateLimitEnabled returns true when Upstash env is configured', async () => {
    process.env.UPSTASH_REDIS_REST_URL = 'https://example.upstash.io';
    process.env.UPSTASH_REDIS_REST_TOKEN = 'test-token';

    const { isDurableRateLimitEnabled } = await import('./rate-limit');
    expect(isDurableRateLimitEnabled()).toBe(true);
  });

  it('uses in-memory limiting when Redis env is missing', async () => {
    const { rateLimit } = await import('./rate-limit');
    const limiter = rateLimit({ interval: 60_000, limit: 2, prefix: 'test-memory' });

    const first = await limiter.check('user-a');
    const second = await limiter.check('user-a');
    const third = await limiter.check('user-a');

    expect(first.success).toBe(true);
    expect(second.success).toBe(true);
    expect(third.success).toBe(false);
    expect(mockLimit).not.toHaveBeenCalled();
  });

  it('falls back to in-memory when Redis limit throws', async () => {
    process.env.UPSTASH_REDIS_REST_URL = 'https://example.upstash.io';
    process.env.UPSTASH_REDIS_REST_TOKEN = 'test-token';
    mockLimit.mockRejectedValue(new Error('Redis unavailable'));

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const { rateLimit } = await import('./rate-limit');
    const limiter = rateLimit({ interval: 60_000, limit: 1, prefix: 'test-fallback' });

    const allowed = await limiter.check('user-b');
    const blocked = await limiter.check('user-b');

    expect(allowed.success).toBe(true);
    expect(blocked.success).toBe(false);
    expect(mockLimit).toHaveBeenCalledTimes(2);
    expect(consoleSpy).toHaveBeenCalled();

    consoleSpy.mockRestore();
  });

  it('retryAfterSecondsFromReset returns at least 1 second', async () => {
    const { retryAfterSecondsFromReset } = await import('./rate-limit');
    const now = Date.now();

    expect(Number(retryAfterSecondsFromReset(now - 5_000))).toBe(1);
    expect(Number(retryAfterSecondsFromReset(now + 30_000))).toBe(30);
  });
});
