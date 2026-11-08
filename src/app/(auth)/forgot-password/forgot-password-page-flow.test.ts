import { describe, expect, it } from 'vitest';
import { presentPasswordResetActionFailure } from './forgot-password-action-result';

describe('forgot-password page submit flow', () => {
  it('shows mapped action copy without a second getAuthErrorMessage pass', () => {
    const actionResult = {
      success: false as const,
      error: 'Too many requests. Please try again later.',
    };
    expect(presentPasswordResetActionFailure(actionResult)).toBe(actionResult.error);
  });
});
