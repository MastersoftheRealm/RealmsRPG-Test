/**
 * Auth Types
 * ===========
 * Unified auth user type for Supabase.
 */

export interface AuthUser {
  id: string;
  uid: string; // Legacy alias for id, still used widely across the API layer
  email?: string | null | undefined;
  displayName?: string | null | undefined;
  /** Active avatar URL — mapped from Supabase `user_metadata.avatar_url` (not legacy Firebase-only). */
  photoURL?: string | null | undefined;
  emailVerified?: boolean | undefined;
  /** Auth provider: 'email' | 'google' | 'apple' etc. (Supabase compat) */
  provider?: string | undefined;
}

export interface SessionUser {
  uid: string;
  email?: string | undefined;
  name?: string | undefined;
  picture?: string | undefined;
  emailVerified?: boolean | undefined;
}
