/**
 * Forgot Username Server Action
 * =============================
 * Looks up user by email in Supabase. For security, always returns success.
 * In production, would trigger email with username (not implemented).
 */

'use server';

import { createClient } from '@/lib/supabase/server';

export async function submitForgotUsernameAction(email: string): Promise<void> {
  const normalized = email.toLowerCase().trim();
  if (!normalized) return;

  const supabase = await createClient();
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('username')
    .eq('email', normalized)
    .maybeSingle();

  // TODO: If profile exists, send email with username via Resend/SendGrid/etc.
  void profile;
}
