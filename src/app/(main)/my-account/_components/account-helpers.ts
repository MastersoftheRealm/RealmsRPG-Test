/**
 * My Account pure helpers (TASK-666)
 */

import type { AuthUser } from '@/types/auth';
import type { AccountProfile } from '@/hooks';

export type AccountMessage = { type: 'success' | 'error'; text: string };

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
