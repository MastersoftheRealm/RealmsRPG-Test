import { describe, expect, it } from 'vitest';
import { getErrorMessage } from './api-client';

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
