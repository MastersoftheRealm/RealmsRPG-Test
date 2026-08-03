import { describe, expect, it, vi } from 'vitest';
import { getErrorMessage, logClientError } from './api-client';

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
