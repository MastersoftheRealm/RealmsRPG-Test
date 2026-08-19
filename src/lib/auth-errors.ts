/**
 * Auth error message mapping
 * ==========================
 * Maps Supabase Auth / network errors to user-facing copy.
 *
 * Important: do **not** treat any message that merely contains the word "email"
 * as an invalid address — SMTP / confirmation-send failures also mention email.
 */

export type AuthErrorContext =
  | 'login'
  | 'register'
  | 'forgot-password'
  | 'reset-password'
  | 'resend'
  | 'update-email'
  | 'update-password'
  | 'delete-account';

function readAuthError(error: unknown): { message: string; code: string } {
  const e = error as { message?: unknown | undefined; code?: unknown | undefined };
  const message = typeof e?.message === 'string' ? e.message : '';
  const code = typeof e?.code === 'string' ? e.code : '';
  return { message, code };
}

function isInvalidEmailError(message: string, code: string): boolean {
  if (code === 'email_address_invalid') return true;
  if (
    message.includes('email address is invalid') ||
    message.includes('unable to validate email') ||
    message.includes('invalid email') ||
    message.includes('valid email is required')
  ) {
    return true;
  }
  // e.g. "Unable to validate email address: invalid format"
  return message.includes('email') && message.includes('invalid') && message.includes('format');
}

function isAlreadyExistsError(message: string, code: string): boolean {
  return (
    code === 'user_already_exists' ||
    message.includes('already registered') ||
    message.includes('already exists') ||
    message.includes('already in use') ||
    message.includes('user already')
  );
}

function isWeakPasswordError(message: string, code: string): boolean {
  return (
    code === 'weak_password' ||
    message.includes('weak password') ||
    message.includes('password should be') ||
    message.includes('password is too weak') ||
    message.includes('password is known to be weak')
  );
}

function isRateLimitError(message: string, code: string): boolean {
  return (
    code.includes('rate_limit') ||
    code.includes('over_email_send_rate_limit') ||
    message.includes('rate limit') ||
    message.includes('too many') ||
    message.includes('only request this after') ||
    message.includes('security purposes')
  );
}

function isNetworkError(message: string): boolean {
  return (
    message.includes('network') ||
    message.includes('fetch failed') ||
    message.includes('failed to fetch')
  );
}

function isEmailSendFailure(message: string, code: string): boolean {
  if (code === 'unexpected_failure' && message.includes('email')) return true;
  return (
    message.includes('error sending') ||
    message.includes('sending confirmation') ||
    message.includes('error delivering') ||
    message.includes('failed to send') ||
    (message.includes('confirmation email') && message.includes('fail'))
  );
}

function isInvalidCredentialsError(message: string, code: string): boolean {
  return (
    code === 'invalid_credentials' ||
    message.includes('invalid login') ||
    message.includes('invalid credentials') ||
    message.includes('invalid email or password')
  );
}

function isIncorrectPasswordError(message: string, code: string): boolean {
  return (
    isInvalidCredentialsError(message, code) ||
    message.includes('incorrect') ||
    message.includes('wrong password')
  );
}

function fallbackMessage(context: AuthErrorContext): string {
  switch (context) {
    case 'register':
      return 'An error occurred during registration. Please try again.';
    case 'login':
      return 'An error occurred during sign in. Please try again.';
    case 'update-email':
      return 'Failed to update email';
    case 'update-password':
      return 'Failed to update password';
    case 'delete-account':
      return 'Failed to delete account';
    case 'forgot-password':
    case 'resend':
    case 'reset-password':
      return 'An error occurred. Please try again.';
  }
}

/**
 * Convert an unknown auth error into stable UI copy for the given context.
 */
export function getAuthErrorMessage(error: unknown, context: AuthErrorContext = 'login'): string {
  const { message: rawMessage, code: rawCode } = readAuthError(error);
  const message = rawMessage.toLowerCase();
  const code = rawCode.toLowerCase();

  if (
    message.includes('email not confirmed') ||
    message.includes('not confirmed') ||
    code === 'email_not_confirmed'
  ) {
    return 'Please confirm your email before signing in.';
  }

  if (
    (context === 'update-email' || context === 'update-password' || context === 'delete-account') &&
    isIncorrectPasswordError(message, code)
  ) {
    return context === 'update-password' ? 'Current password is incorrect' : 'Incorrect password';
  }

  if (isAlreadyExistsError(message, code)) {
    return context === 'update-email'
      ? 'Email already in use'
      : 'An account with this email already exists.';
  }

  if (isWeakPasswordError(message, code)) {
    return 'Password is too weak. Please choose a stronger password.';
  }

  if (isInvalidEmailError(message, code)) {
    return 'Invalid email address.';
  }

  if (isRateLimitError(message, code)) {
    return context === 'login'
      ? 'Too many failed attempts. Please try again later.'
      : 'Too many requests. Please try again later.';
  }

  if (isNetworkError(message)) {
    return 'Network error. Please check your connection.';
  }

  if (isEmailSendFailure(message, code)) {
    return 'We could not send the email right now. Please try again in a few minutes.';
  }

  if (context === 'login' && isInvalidCredentialsError(message, code)) {
    return 'Invalid email or password';
  }

  if (
    context === 'reset-password' &&
    (message.includes('session') || message.includes('expired') || code.includes('session'))
  ) {
    return 'Your reset session expired. Please request a new reset link.';
  }

  if (rawMessage.trim()) return rawMessage;

  return fallbackMessage(context);
}
