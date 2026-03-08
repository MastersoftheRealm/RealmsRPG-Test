/**
 * Authentication Server Actions
 * ==============================
 * Server actions for auth (Supabase only).
 */

'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import { requireAuth, getSession } from '@/lib/supabase/session';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { isAdmin } from '@/lib/admin';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function signOutAction() {
  revalidatePath('/', 'layout');
  redirect('/login');
}

async function generateDefaultUsername(): Promise<string> {
  const supabase = await createServerClient();
  for (let i = 0; i < 20; i++) {
    const num = Math.floor(100000 + Math.random() * 900000);
    const username = `Player${num}`.toLowerCase();
    const { data } = await supabase.from('user_profiles').select('id').eq('username', username).maybeSingle();
    if (!data) return username;
  }
  return `Player${Date.now().toString(36)}`;
}

export async function createUserProfileAction(data: {
  uid: string;
  email: string;
  username?: string;
  displayName?: string;
}) {
  try {
    let username = data.username?.trim();
    if (!username) username = await generateDefaultUsername();
    const normalized = username.toLowerCase();
    const supabase = await createServerClient();
    const now = new Date().toISOString();

    await supabase.from('user_profiles').upsert(
      {
        id: data.uid,
        email: data.email,
        display_name: data.displayName ?? null,
        username: normalized,
        created_at: now,
        updated_at: now,
      },
      { onConflict: 'id' }
    );
    await supabase.from('usernames').upsert(
      { username: normalized, user_id: data.uid },
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
    const supabase = await createServerClient();
    const updates: Record<string, unknown> = {};
    if (data.displayName !== undefined) updates.display_name = data.displayName;
    if (data.username !== undefined) {
      updates.username = data.username.toLowerCase().trim();
      updates.last_username_change = new Date().toISOString();
    }
    await supabase.from('user_profiles').update(updates).eq('id', user.uid);
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

    const p = profile as Record<string, unknown>;
    return {
      profile: {
        uid: user.uid,
        id: p.id,
        email: p.email,
        displayName: p.display_name,
        username: p.username,
        photoUrl: p.photo_url,
        role: p.role,
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
    const normalized = username.toLowerCase().trim();
    const supabase = await createServerClient();
    const { data } = await supabase.from('user_profiles').select('id').eq('username', normalized).maybeSingle();
    return { available: !data };
  } catch (error) {
    console.error('Error checking username:', error);
    return { available: false, error: 'Failed to check username' };
  }
}

const USERNAME_BLOCKLIST = [
  'admin', 'moderator', 'support', 'realmsrpg', 'realms', 'official',
  'null', 'undefined', 'delete', 'remove', 'system', 'root',
];
const USERNAME_MIN_LEN = 3;
const USERNAME_MAX_LEN = 24;
const RATE_LIMIT_DAYS = 7;

export async function changeUsernameAction(newUsername: string) {
  try {
    const user = await requireAuth();
    const trimmed = newUsername.trim();
    const normalized = trimmed.toLowerCase();
    const admin = await isAdmin(user.uid);

    if (admin) {
      if (trimmed.length === 0) return { success: false, error: 'Username cannot be empty' };
    } else {
      if (trimmed.length < USERNAME_MIN_LEN) return { success: false, error: `Username must be at least ${USERNAME_MIN_LEN} characters` };
      if (trimmed.length > USERNAME_MAX_LEN) return { success: false, error: `Username must be at most ${USERNAME_MAX_LEN} characters` };
      if (!/^[a-zA-Z0-9_-]+$/.test(trimmed)) return { success: false, error: 'Username can only contain letters, numbers, underscores, and hyphens' };
      const blocked = USERNAME_BLOCKLIST.some((w) => normalized.includes(w));
      if (blocked) return { success: false, error: 'This username is not allowed' };
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
      .update({ username: normalized, last_username_change: new Date().toISOString() })
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

    const { data: memberRows } = await supabase.from('campaign_members').select('campaign_id').eq('user_id', user.uid);
    for (const { campaign_id: campaignId } of memberRows ?? []) {
      const { data: c } = await supabase.from('campaigns').select('memberIds, characters').eq('id', campaignId).maybeSingle();
      if (!c) continue;
      const members = ((c.memberIds as string[]) || []).filter((id) => id !== user.uid);
      const chars = ((c.characters as Array<{ userId: string; characterId: string }>) || []).filter((cc) => cc.userId !== user.uid);
      await supabase.from('campaigns').update({ memberIds: members, characters: chars }).eq('id', campaignId);
    }
    await supabase.from('campaign_members').delete().eq('user_id', user.uid);

    await supabase.from('characters').delete().eq('user_id', user.uid);
    await supabase.from('user_powers').delete().eq('user_id', user.uid);
    await supabase.from('user_techniques').delete().eq('user_id', user.uid);
    await supabase.from('user_items').delete().eq('user_id', user.uid);
    await supabase.from('user_creatures').delete().eq('user_id', user.uid);
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
