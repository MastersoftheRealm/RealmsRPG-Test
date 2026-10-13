/**
 * My Account pure helpers (TASK-666)
 */

import type { AuthUser } from '@/types/auth';
import type { AccountProfile } from '@/hooks';

export type AccountMessage = { type: 'success' | 'error'; text: string };

/** HTML `pattern`. The hyphen is escaped so the browser `v` flag accepts the class. */
export const USERNAME_PATTERN = '[a-zA-Z0-9_\\-]+';

export const USERNAME_CHARSET_ERROR = 'Letters, numbers, underscores, and hyphens only';

const USERNAME_CHARSET = /^[a-zA-Z0-9_-]+$/;

/** Inline error while typing. Empty is not an error (the field can stay blank). */
export function usernameCharsetError(value: string): string | null {
  if (!value || USERNAME_CHARSET.test(value)) return null;
  return USERNAME_CHARSET_ERROR;
}

export function hasPasswordProvider(authUser: AuthUser | null): boolean {
  if (!authUser) return false;
  return authUser.provider === 'email' || authUser.provider === 'password';
}

export function getAuthProviderLabel(authUser: AuthUser | null): string {
  if (!authUser) return 'Unknown';
  const p = authUser.provider;
  if (p === 'google' || p === 'google.com') return 'Google';
  if (p === 'apple' || p === 'apple.com') return 'Apple';
  if (p === 'email' || p === 'password') return 'Email/Password';
  return p ? p.replace('.com', '') : 'Unknown';
}

export function formatMemberSince(createdAt: AccountProfile['createdAt'] | undefined): string {
  if (createdAt instanceof Date) return createdAt.toLocaleDateString();
  if (createdAt) return new Date(createdAt).toLocaleDateString();
  return 'Unknown';
}
