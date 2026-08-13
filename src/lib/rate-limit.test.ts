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

  it('fails closed when a configured Redis backend errors', async () => {
    process.env.UPSTASH_REDIS_REST_URL = 'https://example.upstash.io';
    process.env.UPSTASH_REDIS_REST_TOKEN = 'test-token';
    mockLimit.mockRejectedValue(new Error('Redis unavailable'));

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const { rateLimit } = await import('./rate-limit');
    const limiter = rateLimit({ interval: 60_000, limit: 10, prefix: 'test-closed', failClosed: true });

    const result = await limiter.check('user-c');

    expect(result.success).toBe(false);
    expect(result.remaining).toBe(0);
    expect(result.reset).toBeGreaterThan(Date.now());
    expect(consoleSpy).toHaveBeenCalled();

    consoleSpy.mockRestore();
  });

  it('failClosed does not reject when no durable backend is configured', async () => {
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const { rateLimit } = await import('./rate-limit');
    const limiter = rateLimit({ interval: 60_000, limit: 1, prefix: 'test-closed-nobackend', failClosed: true });

    const allowed = await limiter.check('user-d');
    const blocked = await limiter.check('user-d');

    expect(allowed.success).toBe(true);
    expect(blocked.success).toBe(false);
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('No durable backend configured'));

    consoleSpy.mockRestore();
  });

  it('warns only once per process about the missing durable backend', async () => {
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const { rateLimit } = await import('./rate-limit');
    const limiter = rateLimit({ interval: 60_000, limit: 5, prefix: 'test-warn-once' });

    await limiter.check('user-e');
    await limiter.check('user-f');

    expect(consoleSpy).toHaveBeenCalledTimes(1);

    consoleSpy.mockRestore();
  });

  it('buildRateLimitKey prefers the authenticated user over the IP', async () => {
    const { buildRateLimitKey } = await import('./rate-limit');

    expect(buildRateLimitKey('char-patch', { userId: 'user-1', ip: '203.0.113.1' })).toBe(
      'char-patch:uid:user-1'
    );
    expect(buildRateLimitKey('char-patch', { userId: '  ', ip: '203.0.113.1' })).toBe(
      'char-patch:ip:203.0.113.1'
    );
    expect(buildRateLimitKey('char-patch', { userId: null, ip: null })).toBe('char-patch:ip:unknown');
  });

  it('resolveClientIp prefers x-real-ip and otherwise takes the last forwarded hop', async () => {
    const { resolveClientIp } = await import('./rate-limit');

    expect(resolveClientIp(new Headers({ 'x-real-ip': '198.51.100.9' }))).toBe('198.51.100.9');
    expect(
      resolveClientIp(
        new Headers({ 'x-real-ip': '198.51.100.9', 'x-forwarded-for': 'spoofed, 203.0.113.7' })
      )
    ).toBe('198.51.100.9');
    // A client-prepended hop must not become the limiter key.
    expect(resolveClientIp(new Headers({ 'x-forwarded-for': 'spoofed, 203.0.113.7' }))).toBe(
      '203.0.113.7'
    );
    expect(resolveClientIp(new Headers())).toBe('unknown');
  });

  it('retryAfterSecondsFromReset returns at least 1 second', async () => {
    const { retryAfterSecondsFromReset } = await import('./rate-limit');
    const now = Date.now();

    expect(Number(retryAfterSecondsFromReset(now - 5_000))).toBe(1);
    expect(Number(retryAfterSecondsFromReset(now + 30_000))).toBe(30);
  });
});
