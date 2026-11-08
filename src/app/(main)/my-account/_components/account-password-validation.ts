import { PASSWORD_MIN_LENGTH } from '@/lib/password-policy';

/** Client-side validation before calling changeAccountPasswordAction. */
export function validateNewAccountPassword(password: string): string | null {
  if (password.length < PASSWORD_MIN_LENGTH) {
    return `Password must be at least ${PASSWORD_MIN_LENGTH} characters`;
  }
  return null;
}
