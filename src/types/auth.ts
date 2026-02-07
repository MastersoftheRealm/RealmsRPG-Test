/**
 * Auth Types
 * ===========
 * Unified auth user type for Supabase (replaces Firebase User)
 */

export interface AuthUser {
  id: string;
  uid: string; // Alias for id (Firebase compatibility)
  email?: string | null;
  displayName?: string | null;
  photoURL?: string | null;
  emailVerified?: boolean;
  /** Auth provider: 'email' | 'google' | 'apple' etc. (Supabase compat) */
  provider?: string;
}

export interface SessionUser {
  uid: string;
  email?: string;
  name?: string;
  picture?: string;
  emailVerified?: boolean;
}
