import { describe, expect, it } from 'vitest';
import {
  AUTH_EMAIL_NOT_CONFIRMED_MESSAGE,
  AUTH_INVALID_CREDENTIALS_LOGIN_MESSAGE,
} from '@/lib/auth-errors';
import { presentLoginActionFailure } from './login-action-result';

describe('presentLoginActionFailure', () => {
  it('surfaces unconfirmed-email copy and enables the resend panel', () => {
    const presented = presentLoginActionFailure({
      success: false,
      error: AUTH_EMAIL_NOT_CONFIRMED_MESSAGE,
      reason: 'email_not_confirmed',
    });
    expect(presented).toEqual({
      error: AUTH_EMAIL_NOT_CONFIRMED_MESSAGE,
      showResendConfirmation: true,
    });
  });

  it('keeps bad-credentials copy without the resend panel', () => {
    const presented = presentLoginActionFailure({
      success: false,
      error: AUTH_INVALID_CREDENTIALS_LOGIN_MESSAGE,
      reason: 'invalid_credentials',
    });
    expect(presented).toEqual({
      error: AUTH_INVALID_CREDENTIALS_LOGIN_MESSAGE,
      showResendConfirmation: false,
    });
  });

  it('does not remap already-friendly generic copy', () => {
    const presented = presentLoginActionFailure({
      success: false,
      error: 'An error occurred during sign in. Please try again.',
      reason: 'generic',
    });
    expect(presented.error).toBe('An error occurred during sign in. Please try again.');
    expect(presented.showResendConfirmation).toBe(false);
  });
});
