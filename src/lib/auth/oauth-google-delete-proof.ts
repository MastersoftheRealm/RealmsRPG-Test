import type { User } from '@supabase/supabase-js';

/** Allow small clock skew between Supabase identity timestamps and intent iat. */
const GOOGLE_IDENTITY_SIGN_IN_SKEW_S = 60;

function identityTimestampSec(identity: {
  last_sign_in_at?: string | undefined;
  updated_at?: string | undefined;
}): number | null {
  const raw = identity.last_sign_in_at ?? identity.updated_at;
  if (!raw) return null;
  const sec = Math.floor(new Date(raw).getTime() / 1000);
  return Number.isFinite(sec) ? sec : null;
}

/**
 * True when the linked Google identity's last_sign_in_at/updated_at shows Google
 * authenticated within [windowStart - skew, windowEnd] (seconds).
 */
export function googleIdentityFreshSignInInWindow(
  user: User,
  windowStartSec: number,
  windowEndSec: number,
  skewSec = GOOGLE_IDENTITY_SIGN_IN_SKEW_S,
): boolean {
  const google = (user.identities ?? []).find((entry) => entry.provider === 'google');
  if (!google) return false;
  const ts = identityTimestampSec(google);
  if (ts === null) return false;
  return ts >= windowStartSec - skewSec && ts <= windowEndSec;
}
