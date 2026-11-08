import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  AUTH_EMAIL_NOT_CONFIRMED_MESSAGE,
  AUTH_INVALID_CREDENTIALS_LOGIN_MESSAGE,
} from '@/lib/auth-errors';
import { presentLoginActionFailure } from './login/login-action-result';

const mockSignInWithPassword = vi.fn();
const mockSignUp = vi.fn();
const mockResetPasswordForEmail = vi.fn();
const mockResend = vi.fn();
const mockLimiterCheck = vi.fn();

vi.mock('next/headers', () => ({
  headers: vi.fn(async () => new Headers({ 'x-real-ip': '198.51.100.2' })),
}));

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(async () => ({
    auth: {
      signInWithPassword: mockSignInWithPassword,
      signUp: mockSignUp,
      resetPasswordForEmail: mockResetPasswordForEmail,
      resend: mockResend,
    },
  })),
}));

vi.mock('@/lib/rate-limit', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/rate-limit')>();
  return {
    ...actual,
    authActionLimiter: { check: mockLimiterCheck },
  };
});

describe('auth-actions rate limits', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLimiterCheck.mockResolvedValue({ success: true, remaining: 4, reset: Date.now() + 60_000 });
    mockSignInWithPassword.mockResolvedValue({ error: null });
    mockSignUp.mockResolvedValue({ data: { session: {} }, error: null });
    mockResetPasswordForEmail.mockResolvedValue({ error: null });
    mockResend.mockResolvedValue({ error: null });
  });

  it('loginWithPasswordAction returns friendly copy when rate limited', async () => {
    mockLimiterCheck.mockResolvedValue({
      success: false,
      remaining: 0,
      reset: Date.now() + 60_000,
    });

    const { loginWithPasswordAction } = await import('./auth-actions');
    const result = await loginWithPasswordAction('user@example.com', 'secret');

    expect(result).toEqual({
      success: false,
      error: 'Too many failed attempts. Please try again later.',
      reason: 'rate_limited',
      rateLimited: true,
    });
    expect(mockSignInWithPassword).not.toHaveBeenCalled();
    expect(mockLimiterCheck).toHaveBeenCalledWith('auth-login:ip:198.51.100.2:em:user@example.com');
  });

  it('signUpAction returns friendly copy when rate limited', async () => {
    mockLimiterCheck.mockResolvedValue({
      success: false,
      remaining: 0,
      reset: Date.now() + 60_000,
    });

    const { signUpAction } = await import('./auth-actions');
    const result = await signUpAction('user@example.com', 'secret');

    expect(result).toEqual({
      success: false,
      error: 'Too many requests. Please try again later.',
      rateLimited: true,
    });
    expect(mockSignUp).not.toHaveBeenCalled();
  });

  it('signUpAction returns the same success shape when the email already exists', async () => {
    mockSignUp.mockResolvedValue({
      data: { session: null },
      error: { message: 'User already registered', code: 'user_already_exists' },
    });

    const { signUpAction } = await import('./auth-actions');
    const result = await signUpAction('user@example.com', 'secret');

    expect(result).toEqual({
      success: true,
      needsEmailConfirmation: true,
    });
  });

  it('loginWithPasswordAction exposes unconfirmed-email reason for the login page', async () => {
    mockSignInWithPassword.mockResolvedValue({
      error: { message: 'Email not confirmed', code: 'email_not_confirmed' },
    });

    const { loginWithPasswordAction } = await import('./auth-actions');
    const result = await loginWithPasswordAction('user@example.com', 'secret');
    expect(result).toEqual({
      success: false,
      error: AUTH_EMAIL_NOT_CONFIRMED_MESSAGE,
      reason: 'email_not_confirmed',
    });
    if (!result.success) {
      expect(presentLoginActionFailure(result)).toEqual({
        error: AUTH_EMAIL_NOT_CONFIRMED_MESSAGE,
        showResendConfirmation: true,
      });
    }
  });

  it('loginWithPasswordAction maps bad credentials without invalid-email false positive', async () => {
    mockSignInWithPassword.mockResolvedValue({
      error: { message: 'Invalid login credentials', code: 'invalid_credentials' },
    });

    const { loginWithPasswordAction } = await import('./auth-actions');
    const result = await loginWithPasswordAction('user@example.com', 'wrong');
    expect(result).toEqual({
      success: false,
      error: AUTH_INVALID_CREDENTIALS_LOGIN_MESSAGE,
      reason: 'invalid_credentials',
    });
    if (!result.success) {
      expect(presentLoginActionFailure(result)).toEqual({
        error: AUTH_INVALID_CREDENTIALS_LOGIN_MESSAGE,
        showResendConfirmation: false,
      });
    }
  });

  it('loginWithPasswordAction hides unknown Supabase errors', async () => {
    mockSignInWithPassword.mockResolvedValue({
      error: { message: 'Database constraint leaked to client' },
    });

    const { loginWithPasswordAction } = await import('./auth-actions');
    const result = await loginWithPasswordAction('user@example.com', 'secret');

    expect(result).toEqual({
      success: false,
      error: 'An error occurred during sign in. Please try again.',
      reason: 'generic',
    });
  });

  it('requestPasswordResetAction returns friendly copy when rate limited', async () => {
    mockLimiterCheck.mockResolvedValue({
      success: false,
      remaining: 0,
      reset: Date.now() + 60_000,
    });

    const { requestPasswordResetAction } = await import('./auth-actions');
    const result = await requestPasswordResetAction('user@example.com');

    expect(result).toEqual({
      success: false,
      error: 'Too many requests. Please try again later.',
      rateLimited: true,
    });
    expect(mockResetPasswordForEmail).not.toHaveBeenCalled();
  });
});
