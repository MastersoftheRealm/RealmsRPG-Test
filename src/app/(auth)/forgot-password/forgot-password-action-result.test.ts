import { describe, expect, it } from 'vitest';
import { presentPasswordResetActionFailure } from './forgot-password-action-result';

describe('presentPasswordResetActionFailure', () => {
  it('returns action copy verbatim for a mapped failure', () => {
    expect(
      presentPasswordResetActionFailure({
        success: false,
        error: 'Too many requests. Please try again later.',
      }),
    ).toBe('Too many requests. Please try again later.');
  });

  it('does not rewrite generic registration-style copy as invalid email', () => {
    const copy = 'An error occurred. Please try again.';
    expect(
      presentPasswordResetActionFailure({
        success: false,
        error: copy,
      }),
    ).toBe(copy);
  });
});
