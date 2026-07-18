import { describe, expect, it } from 'vitest';
import { getAuthErrorMessage } from './auth-errors';

describe('getAuthErrorMessage', () => {
  it('does not label SMTP / confirmation-send failures as invalid email', () => {
    expect(
      getAuthErrorMessage(new Error('Error sending confirmation email'), 'register')
    ).toBe('We could not send the email right now. Please try again in a few minutes.');
    expect(
      getAuthErrorMessage({ message: 'Failed to send email', code: 'unexpected_failure' }, 'resend')
    ).toBe('We could not send the email right now. Please try again in a few minutes.');
  });

  it('maps real invalid-email cases only', () => {
    expect(
      getAuthErrorMessage(
        { message: 'Unable to validate email address: invalid format', code: 'email_address_invalid' },
        'register'
      )
    ).toBe('Invalid email address.');
    expect(
      getAuthErrorMessage(new Error('Email address is invalid'), 'forgot-password')
    ).toBe('Invalid email address.');
  });

  it('does not treat arbitrary messages containing "email" as invalid', () => {
    expect(
      getAuthErrorMessage(new Error('Please check your email inbox'), 'register')
    ).toBe('Please check your email inbox');
  });

  it('maps already-exists and weak-password without over-matching "password"', () => {
    expect(
      getAuthErrorMessage({ message: 'User already registered', code: 'user_already_exists' }, 'register')
    ).toBe('An account with this email already exists.');
    expect(
      getAuthErrorMessage({ message: 'Password should be at least 6 characters', code: 'weak_password' }, 'register')
    ).toBe('Password is too weak. Please choose a stronger password.');
    // Must not claim "password too weak" for every message that mentions password
    expect(
      getAuthErrorMessage(new Error('Invalid login credentials'), 'login')
    ).toBe('Invalid email or password');
  });

  it('maps login credentials, confirmation, rate limit, and network', () => {
    expect(
      getAuthErrorMessage({ message: 'Invalid login credentials', code: 'invalid_credentials' }, 'login')
    ).toBe('Invalid email or password');
    expect(
      getAuthErrorMessage({ message: 'Email not confirmed', code: 'email_not_confirmed' }, 'login')
    ).toBe('Please confirm your email before signing in.');
    expect(
      getAuthErrorMessage(new Error('Email rate limit exceeded'), 'forgot-password')
    ).toBe('Too many requests. Please try again later.');
    expect(
      getAuthErrorMessage(new Error('Failed to fetch'), 'login')
    ).toBe('Network error. Please check your connection.');
  });

  it('maps update-email account copy without the register false-invalid path', () => {
    expect(
      getAuthErrorMessage(new Error('Current password is incorrect'), 'update-email')
    ).toBe('Incorrect password');
    expect(
      getAuthErrorMessage({ message: 'Email already in use', code: 'user_already_exists' }, 'update-email')
    ).toBe('Email already in use');
    expect(
      getAuthErrorMessage({ message: 'Email address is invalid', code: 'email_address_invalid' }, 'update-email')
    ).toBe('Invalid email address.');
    expect(
      getAuthErrorMessage(new Error('Error sending confirmation email'), 'update-email')
    ).toBe('We could not send the email right now. Please try again in a few minutes.');
  });
});
