import type { User } from '@supabase/supabase-js';

/** Sentinel returned through server actions; mapped in `lib/auth-errors.ts` (human wording pass). */
export const OAUTH_DELETE_REAUTH_REQUIRED = 'oauth_delete_reauth_required';

/** Fresh Google/OAuth sign-in window before OAuth-only account deletion. */
export const OAUTH_DELETE_FRESH_SIGN_IN_MS = 5 * 60 * 1000;

function oauthDeleteSignInAgeMs(user: User, nowMs = Date.now()): number | null {
  const raw = user.last_sign_in_at;
  if (typeof raw !== 'string' || !raw.trim()) return null;
  const at = Date.parse(raw);
  if (Number.isNaN(at)) return null;
  return nowMs - at;
}

export function isOAuthDeleteSignInFresh(
  user: User,
  nowMs = Date.now(),
  maxAgeMs = OAUTH_DELETE_FRESH_SIGN_IN_MS,
): boolean {
  const age = oauthDeleteSignInAgeMs(user, nowMs);
  if (age == null) return false;
  return age >= 0 && age <= maxAgeMs;
}

export function assertOAuthDeleteFreshSignIn(
  user: User,
  nowMs = Date.now(),
): { ok: true } | { ok: false; error: string } {
  if (isOAuthDeleteSignInFresh(user, nowMs)) {
    return { ok: true };
  }
  return { ok: false, error: OAUTH_DELETE_REAUTH_REQUIRED };
}
