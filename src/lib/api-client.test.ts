import { describe, expect, it, vi } from 'vitest';
import { ApiError, apiFetch, getErrorMessage, logClientError } from './api-client';

describe('logClientError', () => {
  it('logs with context prefix', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    logClientError('test-context', new Error('boom'));
    expect(spy).toHaveBeenCalledWith('[Client Error] test-context:', expect.any(Error));
    spy.mockRestore();
  });
});

describe('getErrorMessage', () => {
  it('prefers Error.message', () => {
    expect(getErrorMessage(new Error('boom'), 'fallback')).toBe('boom');
  });

  it('accepts string errors', () => {
    expect(getErrorMessage('nope', 'fallback')).toBe('nope');
  });

  it('reads message from plain objects', () => {
    expect(getErrorMessage({ message: 'supabase failed' }, 'fallback')).toBe('supabase failed');
  });

  it('uses fallback for empty or unknown values', () => {
    expect(getErrorMessage(null, 'fallback')).toBe('fallback');
    expect(getErrorMessage({}, 'fallback')).toBe('fallback');
    expect(getErrorMessage(new Error('   '), 'fallback')).toBe('fallback');
  });
});

describe('apiFetch error body (TASK-754)', () => {
  it('joins array details onto the player-facing message', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 400,
        json: async () => ({
          error: 'Character is not a legal level 1 build',
          details: [
            'Ability points spent (9) exceed the level 1 budget (7).',
            'Currency cannot be negative — a character cannot start play in debt.',
          ],
        }),
      })
    );

    try {
      await apiFetch('/api/characters', { method: 'POST' });
      expect.unreachable('apiFetch should reject');
    } catch (err) {
      expect(err).toBeInstanceOf(ApiError);
      expect(err).toMatchObject({
        status: 400,
        message: expect.stringMatching(/Ability points spent.*Currency cannot be negative/),
      });
    } finally {
      vi.unstubAllGlobals();
    }
  });
});
