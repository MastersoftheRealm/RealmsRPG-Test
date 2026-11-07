import type { User } from '@supabase/supabase-js';

/** Allow small clock skew between Supabase identity timestamps and intent iat. */
const GOOGLE_IDENTITY_SIGN_IN_SKEW_S = 60;

function googleIdentityUpdatedAtSec(identity: { updated_at?: string | undefined }): number | null {
  const raw = identity.updated_at;
  if (!raw) return null;
  const sec = Math.floor(new Date(raw).getTime() / 1000);
  return Number.isFinite(sec) ? sec : null;
}

/**
 * True when the linked Google identity's `updated_at` shows Google authenticated
 * within [windowStart - skew, windowEnd] (seconds).
 *
 * We use `updated_at` (not `last_sign_in_at`): on deployed GoTrue (~v2.197.0),
 * returning Google users often keep a stale `last_sign_in_at` while OAuth sign-in
 * advances `updated_at`. PKCE-bound intent, verifier hash, uid, and `amr` oauth
 * bound other ways `updated_at` could change without a fresh Google sign-in.
 */
export function googleIdentityFreshSignInInWindow(
  user: User,
  windowStartSec: number,
  windowEndSec: number,
  skewSec = GOOGLE_IDENTITY_SIGN_IN_SKEW_S,
): boolean {
  const google = (user.identities ?? []).find((entry) => entry.provider === 'google');
  if (!google) return false;
  const ts = googleIdentityUpdatedAtSec(google);
  if (ts === null) return false;
  return ts >= windowStartSec - skewSec && ts <= windowEndSec;
}
