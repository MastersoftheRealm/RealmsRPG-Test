/**
 * Authentication Server Actions
 * ==============================
 * Server actions for auth (Supabase only).
 */

'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import { headers } from 'next/headers';
import { requireAuth, getSession } from '@/lib/supabase/session';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { isAdmin } from '@/lib/admin';
import { getRolePolicyForUser } from '@/lib/role-policy';
import { validateUsername } from '@/lib/username-rules';
import { buildRateLimitKey, resolveClientIp, strictLimiter } from '@/lib/rate-limit';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function signOutAction() {
  const supabase = await createServerClient();
  await supabase.auth.signOut();
  revalidatePath('/', 'layout');
  redirect('/login');
}

async function generateDefaultUsername(): Promise<string> {
  const supabase = await createServerClient();
  for (let i = 0; i < 20; i++) {
    const num = Math.floor(100000 + Math.random() * 900000);
    const displayUsername = `Player${num}`;
    const normalized = displayUsername.toLowerCase();
    const { data } = await supabase.from('user_profiles').select('id').eq('username', normalized).maybeSingle();
    if (!data) return displayUsername;
  }
  return `Player${Date.now().toString(36).toUpperCase()}`;
}

export async function createUserProfileAction(data: {
  uid?: string;
  email?: string;
  username?: string;
  displayName?: string;
}) {
  try {
    // SEC-02: bind identity to the verified session, never the client-supplied
    // uid/email. All callers (auth callback/confirm, register) establish the
    // session before invoking this action.
    const { user: sessionUser } = await getSession();
    if (!sessionUser?.uid) {
      return { success: false, error: 'Not authenticated' };
    }
    const uid = sessionUser.uid;
    const email = (data.email ?? sessionUser.email ?? '').toString();

    const supabase = await createServerClient();
    const now = new Date().toISOString();
    const { data: existing } = await supabase
      .from('user_profiles')
      .select('id, username, username_display')
      .eq('id', uid)
      .maybeSingle();

    const existingUsername = ((existing as { username?: string | null } | null)?.username ?? null)?.toString().trim() || null;
    const existingUsernameDisplay = ((existing as { username_display?: string | null } | null)?.username_display ?? null)?.toString().trim() || null;

    let usernameDisplay = data.username?.trim();
    if (usernameDisplay) {
      const usernameCheck = validateUsername(usernameDisplay);
      if (!usernameCheck.ok) {
        return { success: false, error: usernameCheck.error };
      }
    }
    if (!usernameDisplay) {
      // Critical: never overwrite a user's chosen username with a generated default.
      // This action can be called from auth callback/confirm routes on subsequent logins.
      usernameDisplay = existingUsernameDisplay ?? existingUsername ?? (await generateDefaultUsername());
    }
    const normalized = usernameDisplay.toLowerCase();

    if (existing) {
      const updates: Record<string, unknown> = {
        email,
        display_name: data.displayName ?? null,
        updated_at: now,
      };
      if (!existingUsername) {
        updates.username = normalized;
        updates.username_display = usernameDisplay;
        updates.last_username_change = null;
      }
      await supabase.from('user_profiles').update(updates).eq('id', uid);
    } else {
      await supabase.from('user_profiles').insert({
        id: uid,
        email,
        display_name: data.displayName ?? null,
        username: normalized,
        username_display: usernameDisplay,
        show_tooltips: true,
        created_at: now,
        updated_at: now,
      });
    }
    await supabase.from('usernames').upsert(
      { username: normalized, user_id: uid },
      { onConflict: 'username' }
    );
    return { success: true };
  } catch (error) {
    console.error('Error creating user profile:', error);
    return { success: false, error: 'Failed to create user profile' };
  }
}

export async function updateUserProfileAction(data: { displayName?: string; username?: string }) {
  try {
    const user = await requireAuth();
    // SEC-03: never write a username without validation, uniqueness, and the
    // rate-limit/usernames-table sync — delegate to the canonical path.
    if (data.username !== undefined) {
      const res = await changeUsernameAction(data.username);
      if (!res.success) return res;
    }
    if (data.displayName !== undefined) {
      const supabase = await createServerClient();
      await supabase.from('user_profiles').update({ display_name: data.displayName }).eq('id', user.uid);
    }
    revalidatePath('/my-account');
    return { success: true };
  } catch (error) {
    console.error('Error updating user profile:', error);
    return { success: false, error: 'Failed to update profile' };
  }
}

export async function getUserProfileAction() {
  try {
    const { user } = await getSession();
    if (!user) return { profile: null, error: null };

    const supabase = await createServerClient();
    const { data: profile } = await supabase.from('user_profiles').select('*').eq('id', user.uid).maybeSingle();
    if (!profile) return { profile: null, error: null };

    const rolePolicy = await getRolePolicyForUser(user.uid, supabase);
    const p = profile as Record<string, unknown>;
    return {
      profile: {
        uid: user.uid,
        id: p.id,
        email: p.email,
        displayName: p.display_name,
        username: p.username,
        usernameDisplay: p.username_display,
        photoUrl: p.photo_url,
        role: p.role,
        rolePolicy,
        showTooltips: p.show_tooltips,
        lastUsernameChange: p.last_username_change,
        createdAt: p.created_at,
        updatedAt: p.updated_at,
      },
      error: null,
    };
  } catch (error) {
    console.error('Error getting user profile:', error);
    return { profile: null, error: 'Failed to get profile' };
  }
}

export async function checkUsernameAvailableAction(username: string) {
  try {
    // SEC-07: this endpoint is a username-existence oracle. Require an
    // authenticated session and rate-limit per user/IP to prevent enumeration.
    const { user } = await getSession();
    if (!user?.uid) {
      return { available: false, error: 'Not authenticated' };
    }
    const ip = resolveClientIp(await headers());
    const { success } = strictLimiter.check(buildRateLimitKey('username-check', { userId: user.uid, ip }));
    if (!success) {
      return { available: false, error: 'Too many requests' };
    }
    const normalized = username.toLowerCase().trim();
    const supabase = await createServerClient();
    const { data } = await supabase.from('user_profiles').select('id').eq('username', normalized).maybeSingle();
    return { available: !data };
  } catch (error) {
    console.error('Error checking username:', error);
    return { available: false, error: 'Failed to check username' };
  }
}

const RATE_LIMIT_DAYS = 7;

export async function changeUsernameAction(newUsername: string) {
  try {
    const user = await requireAuth();
    const trimmed = newUsername.trim();
    const normalized = trimmed.toLowerCase();
    const admin = await isAdmin(user.uid);

    const usernameCheck = validateUsername(trimmed, { isAdmin: admin, allowEmpty: admin });
    if (!usernameCheck.ok) {
      return { success: false, error: usernameCheck.error };
    }

    const supabase = await createServerClient();
    const { data: profile } = await supabase.from('user_profiles').select('username, last_username_change').eq('id', user.uid).maybeSingle();
    const currentUsername = ((profile as { username?: string } | null)?.username ?? '').toLowerCase();
    if (normalized === currentUsername) return { success: false, error: 'New username is the same as your current username' };

    if (!admin && profile) {
      const lastChange = (profile as { last_username_change?: string }).last_username_change;
      if (lastChange) {
        const t = typeof lastChange === 'string' ? new Date(lastChange).getTime() : lastChange;
        const daysSince = (Date.now() - t) / (24 * 60 * 60 * 1000);
        if (daysSince < RATE_LIMIT_DAYS) {
          const remaining = Math.ceil(RATE_LIMIT_DAYS - daysSince);
          return { success: false, error: `You can change your username again in ${remaining} day(s)` };
        }
      }
    }

    const { data: taken } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('username', normalized)
      .neq('id', user.uid)
      .maybeSingle();
    if (taken) return { success: false, error: 'This username is already taken' };

    if (currentUsername) {
      await supabase.from('usernames').delete().eq('username', currentUsername);
    }
    await supabase.from('usernames').upsert({ username: normalized, user_id: user.uid }, { onConflict: 'username' });
    await supabase
      .from('user_profiles')
      .update({
        username: normalized,
        username_display: trimmed,
        last_username_change: new Date().toISOString(),
      })
      .eq('id', user.uid);

    revalidatePath('/my-account');
    return { success: true };
  } catch (error) {
    console.error('Error changing username:', error);
    return { success: false, error: 'Failed to change username' };
  }
}

export async function deleteAccountAction() {
  try {
    const user = await requireAuth();
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    const supabase = await createServerClient();

    // BE-02/06: membership is tracked solely in campaign_members; strip this
    // user's characters from each campaign roster, then drop their memberships.
    const { data: memberRows } = await supabase.from('campaign_members').select('campaign_id').eq('user_id', user.uid);
    for (const { campaign_id: campaignId } of memberRows ?? []) {
      const { data: c } = await supabase.from('campaigns').select('characters').eq('id', campaignId).maybeSingle();
      if (!c) continue;
      const chars = ((c.characters as Array<{ userId: string; characterId: string }>) || []).filter((cc) => cc.userId !== user.uid);
      await supabase.from('campaigns').update({ characters: chars }).eq('id', campaignId);
    }
    await supabase.from('campaign_members').delete().eq('user_id', user.uid);

    await supabase.from('characters').delete().eq('user_id', user.uid);
    await supabase.from('user_powers').delete().eq('user_id', user.uid);
    await supabase.from('user_techniques').delete().eq('user_id', user.uid);
    await supabase.from('user_empowered_techniques').delete().eq('user_id', user.uid);
    await supabase.from('user_items').delete().eq('user_id', user.uid);
    await supabase.from('user_creatures').delete().eq('user_id', user.uid);
    await supabase.from('user_species').delete().eq('user_id', user.uid);
    await supabase.from('crafting_sessions').delete().eq('user_id', user.uid);
    await supabase.from('user_enhanced_items').delete().eq('user_id', user.uid);
    await supabase.from('usernames').delete().eq('user_id', user.uid);
    await supabase.from('encounters').delete().eq('user_id', user.uid);
    await supabase.from('campaigns').delete().eq('owner_id', user.uid);
    await supabase.from('user_profiles').delete().eq('id', user.uid);

    await supabaseAdmin.auth.admin.deleteUser(user.uid);
    return { success: true };
  } catch (error) {
    console.error('Error deleting account:', error);
    return { success: false, error: 'Failed to delete account' };
  }
}
