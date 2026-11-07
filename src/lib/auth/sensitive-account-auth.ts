import type { User } from '@supabase/supabase-js';
import { assertOAuthDeleteSessionGrant } from '@/lib/auth/oauth-delete-grant';
import { createClient } from '@/lib/supabase/server';
import { requireLiveUser } from '@/lib/supabase/session';

export function authUserHasPasswordLogin(user: User): boolean {
  const identities = user.identities ?? [];
  if (identities.some((entry) => entry.provider === 'email')) return true;
  const provider = user.app_metadata?.provider;
  return provider === 'email' || provider === 'password';
}

export type SensitiveAccountReauthInput = {
  currentPassword?: string | undefined;
  deleteConfirm?: string | undefined;
};

/** Server-side re-authentication before delete / email / password changes. */
export async function assertSensitiveAccountReauth(
  input: SensitiveAccountReauthInput,
): Promise<{ ok: true } | { ok: false; error: string }> {
  await requireLiveUser();
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) {
    return { ok: false, error: 'Authentication required' };
  }

  if (authUserHasPasswordLogin(data.user)) {
    const password = input.currentPassword ?? '';
    if (password.length === 0) {
      return { ok: false, error: 'Current password is incorrect' };
    }
    const email = data.user.email?.trim();
    if (!email) {
      return { ok: false, error: 'Authentication required' };
    }
    const { error: reauthError } = await supabase.auth.signInWithPassword({ email, password });
    if (reauthError) {
      return { ok: false, error: 'Current password is incorrect' };
    }
    return { ok: true };
  }

  if (input.deleteConfirm !== undefined) {
    if (input.deleteConfirm !== 'DELETE') {
      return { ok: false, error: 'Failed to delete account. Please try again.' };
    }
    if (!authUserHasPasswordLogin(data.user)) {
      return assertOAuthDeleteSessionGrant(data.user.id);
    }
    return { ok: true };
  }

  return { ok: false, error: 'Current password is incorrect' };
}
