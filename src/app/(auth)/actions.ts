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

/** Postgres unique-violation; RLS/permission denial. */
const UNIQUE_VIOLATION = '23505';
const INSUFFICIENT_PRIVILEGE = '42501';
const USERNAME_TAKEN_ERROR = 'This username is already taken';
const MAX_GENERATED_USERNAME_ATTEMPTS = 5;

function isUniqueViolation(error: { code?: string } | null): boolean {
  return error?.code === UNIQUE_VIOLATION;
}

/**
 * A username claim can fail two ways: the row exists (unique violation) or it
 * exists and belongs to someone else, so the owner-scoped UPDATE policy refuses
 * the upsert. Both mean the same thing to the user.
 */
function isUsernameConflict(error: { code?: string } | null): boolean {
  return isUniqueViolation(error) || error?.code === INSUFFICIENT_PRIVILEGE;
}

export async function signOutAction() {
  const supabase = await createServerClient();
  await supabase.auth.signOut();
  revalidatePath('/', 'layout');
  redirect('/login');
}

/**
 * Random default username. Availability is deliberately NOT pre-checked: the only
 * SELECT policy on `user_profiles` is `id = auth.uid()`, so a session client can
 * never see another user's row and any pre-check would always report "free".
 * Callers retry on the unique violation the write returns instead.
 */
function generateDefaultUsername(): string {
  const num = Math.floor(100000 + Math.random() * 900000);
  return `Player${num}`;
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
    const email = (sessionUser.email ?? '').toString();

    const supabase = await createServerClient();
    const now = new Date().toISOString();
    const { data: existing, error: existingError } = await supabase
      .from('user_profiles')
      .select('id, username, username_display')
      .eq('id', uid)
      .maybeSingle();
    if (existingError) throw existingError;

    const existingUsername =
      ((existing as { username?: string | null } | null)?.username ?? null)?.toString().trim() ||
      null;
    const existingUsernameDisplay =
      ((existing as { username_display?: string | null } | null)?.username_display ?? null)
        ?.toString()
        .trim() || null;

    const requestedUsername = data.username?.trim() || null;
    if (requestedUsername) {
      const usernameCheck = validateUsername(requestedUsername);
      if (!usernameCheck.ok) {
        return { success: false, error: usernameCheck.error };
      }
    }

    // Critical: never overwrite a user's chosen username with a generated default.
    // This action can be called from auth callback/confirm routes on subsequent logins.
    const needsUsername = !existingUsername;
    const chosenUsername = needsUsername
      ? (requestedUsername ?? existingUsernameDisplay)
      : existingUsername;

    for (let attempt = 1; attempt <= MAX_GENERATED_USERNAME_ATTEMPTS; attempt++) {
      const usernameDisplay = chosenUsername ?? generateDefaultUsername();
      const normalized = usernameDisplay.toLowerCase();
      // Only a generated name may be swapped for another on collision.
      const canRetry = chosenUsername === null && attempt < MAX_GENERATED_USERNAME_ATTEMPTS;

      const profileWrite = existing
        ? await supabase
            .from('user_profiles')
            .update({
              email,
              display_name: data.displayName ?? null,
              updated_at: now,
              ...(needsUsername
                ? {
                    username: normalized,
                    username_display: usernameDisplay,
                    last_username_change: null,
                  }
                : {}),
            })
            .eq('id', uid)
        : await supabase.from('user_profiles').insert({
            id: uid,
            email,
            display_name: data.displayName ?? null,
            username: normalized,
            username_display: usernameDisplay,
            created_at: now,
            updated_at: now,
          });

      if (profileWrite.error) {
        if (isUniqueViolation(profileWrite.error)) {
          if (canRetry) continue;
          return { success: false, error: USERNAME_TAKEN_ERROR };
        }
        throw profileWrite.error;
      }

      // Keep the `usernames` mapping in step with what the profile now holds.
      const { error: usernameError } = await supabase
        .from('usernames')
        .upsert({ username: normalized, user_id: uid }, { onConflict: 'username' });
      if (usernameError) {
        if (isUsernameConflict(usernameError)) {
          return { success: false, error: USERNAME_TAKEN_ERROR };
        }
        throw usernameError;
      }

      return { success: true };
    }

    return { success: false, error: 'Could not assign a username. Please try again.' };
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
      const { error } = await supabase
        .from('user_profiles')
        .update({ display_name: data.displayName })
        .eq('id', user.uid);
      if (error) throw error;
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
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', user.uid)
      .maybeSingle();
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

/**
 * Format-only username pre-check.
 *
 * `available` is intentionally `null` ("unknown") for a well-formed name: RLS
 * scopes every readable `user_profiles` / `usernames` row to `auth.uid()`, so a
 * session client cannot observe another user's name and any "available: true"
 * would be fabricated. The write path (`changeUsernameAction` /
 * `createUserProfileAction`) is the single source of truth — it maps the unique
 * violation to "already taken". This never blocks submission.
 */
export async function checkUsernameAvailableAction(
  username: string,
): Promise<{ available: boolean | null; error?: string }> {
  try {
    // SEC-07: rate-limited and session-gated so it cannot be used to probe names.
    const { user } = await getSession();
    if (!user?.uid) {
      return { available: null, error: 'Not authenticated' };
    }
    const ip = resolveClientIp(await headers());
    const { success } = await strictLimiter.check(
      buildRateLimitKey('username-check', { userId: user.uid, ip }),
    );
    if (!success) {
      return { available: null, error: 'Too many requests' };
    }

    const usernameCheck = validateUsername(username.trim());
    if (!usernameCheck.ok) {
      return { available: false, error: usernameCheck.error };
    }
    return { available: null };
  } catch (error) {
    console.error('Error checking username:', error);
    return { available: null, error: 'Failed to check username' };
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
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('username, last_username_change')
      .eq('id', user.uid)
      .maybeSingle();
    if (profileError) throw profileError;
    const currentUsername = (
      (profile as { username?: string } | null)?.username ?? ''
    ).toLowerCase();
    if (normalized === currentUsername)
      return { success: false, error: 'New username is the same as your current username' };

    if (!admin && profile) {
      const lastChange = (profile as { last_username_change?: string }).last_username_change;
      if (lastChange) {
        const t = typeof lastChange === 'string' ? new Date(lastChange).getTime() : lastChange;
        const daysSince = (Date.now() - t) / (24 * 60 * 60 * 1000);
        if (daysSince < RATE_LIMIT_DAYS) {
          const remaining = Math.ceil(RATE_LIMIT_DAYS - daysSince);
          return {
            success: false,
            error: `You can change your username again in ${remaining} day(s)`,
          };
        }
      }
    }

    // No availability pre-check: RLS hides other users' rows, so it could only ever
    // report "free". `usernames.username` is the primary key, so claiming the new
    // row IS the uniqueness test — and it happens before the old row is released.
    const { error: claimError } = await supabase
      .from('usernames')
      .insert({ username: normalized, user_id: user.uid });
    const claimedNewRow = !claimError;
    if (claimError) {
      if (!isUsernameConflict(claimError)) throw claimError;
      // A conflicting row we can still read is our own (a previous partial rename);
      // anything else belongs to another user.
      const { data: ownRow, error: ownRowError } = await supabase
        .from('usernames')
        .select('username')
        .eq('username', normalized)
        .maybeSingle();
      if (ownRowError) throw ownRowError;
      if (!ownRow) return { success: false, error: USERNAME_TAKEN_ERROR };
    }

    const { error: updateError } = await supabase
      .from('user_profiles')
      .update({
        username: normalized,
        username_display: trimmed,
        last_username_change: new Date().toISOString(),
      })
      .eq('id', user.uid);
    if (updateError) {
      if (claimedNewRow) {
        // Release the name we reserved so a failed rename leaves nothing behind.
        const { error: releaseError } = await supabase
          .from('usernames')
          .delete()
          .eq('username', normalized)
          .eq('user_id', user.uid);
        if (releaseError) {
          console.error('Failed to release reserved username after a failed rename:', releaseError);
        }
      }
      if (isUniqueViolation(updateError)) return { success: false, error: USERNAME_TAKEN_ERROR };
      throw updateError;
    }

    // Only now is the previous mapping safe to drop.
    if (currentUsername) {
      const { error: oldRowError } = await supabase
        .from('usernames')
        .delete()
        .eq('username', currentUsername)
        .eq('user_id', user.uid);
      if (oldRowError) {
        // The rename itself succeeded; a stale mapping is recoverable.
        console.error('Failed to remove previous username mapping:', oldRowError);
      }
    }

    revalidatePath('/my-account');
    return { success: true };
  } catch (error) {
    console.error('Error changing username:', error);
    return { success: false, error: 'Failed to change username' };
  }
}

type DeleteAccountResult = { success: true } | { success: false; error: string };

/**
 * Delete the caller's account and all of their content.
 *
 * Runs with the service role: the session client has no DELETE policy on
 * `user_profiles`, so the row it must remove — the one whose cascade takes the
 * rest of the user's content with it — would be silently filtered out and leave
 * an orphaned profile behind. Authorization is the verified session below and
 * every statement is scoped to that uid.
 *
 * Every step is checked and the auth identity is destroyed last: a half-finished
 * cascade with no matching auth user is unrecoverable, so a failure must abort.
 */
export async function deleteAccountAction(): Promise<DeleteAccountResult> {
  try {
    const user = await requireAuth();
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    const failed = (step: string, error: unknown): DeleteAccountResult => {
      console.error(`Error deleting account (${step}):`, error);
      return { success: false, error: 'Failed to delete account. Please try again.' };
    };

    // BE-02/06: membership is tracked solely in campaign_members; strip this
    // user's characters from each campaign roster they appear on. Rosters are a
    // JSONB array, so no FK cascade covers them.
    const { data: memberRows, error: memberReadError } = await supabaseAdmin
      .from('campaign_members')
      .select('campaign_id')
      .eq('user_id', user.uid);
    if (memberReadError) return failed('campaign_members read', memberReadError);

    for (const { campaign_id: campaignId } of memberRows ?? []) {
      const { data: campaign, error: campaignReadError } = await supabaseAdmin
        .from('campaigns')
        .select('characters')
        .eq('id', campaignId)
        .maybeSingle();
      if (campaignReadError) return failed('campaign roster read', campaignReadError);
      if (!campaign) continue;

      const roster = (
        (campaign.characters as Array<{ userId?: string; user_id?: string }>) ?? []
      ).filter((entry) => (entry.userId ?? entry.user_id) !== user.uid);
      const { error: rosterError } = await supabaseAdmin
        .from('campaigns')
        .update({ characters: roster })
        .eq('id', campaignId);
      if (rosterError) return failed('campaign roster update', rosterError);
    }

    // Rolls authored in campaigns the user does not own embed their character
    // name and are not reached by any cascade.
    const { error: rollsError } = await supabaseAdmin
      .from('campaign_rolls')
      .delete()
      .eq('user_id', user.uid);
    if (rollsError) return failed('campaign_rolls', rollsError);

    const { error: membershipError } = await supabaseAdmin
      .from('campaign_members')
      .delete()
      .eq('user_id', user.uid);
    if (membershipError) return failed('campaign_members', membershipError);

    // encounters has no FK to user_profiles, so it needs its own delete.
    const { error: encountersError } = await supabaseAdmin
      .from('encounters')
      .delete()
      .eq('user_id', user.uid);
    if (encountersError) return failed('encounters', encountersError);

    // Owned campaigns cascade their members and rolls.
    const { error: campaignsError } = await supabaseAdmin
      .from('campaigns')
      .delete()
      .eq('owner_id', user.uid);
    if (campaignsError) return failed('campaigns', campaignsError);

    // This cascades characters, crafting_sessions, usernames, user_enhanced_items
    // and every user_* library table (all FKs are ON DELETE CASCADE).
    const { error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .delete()
      .eq('id', user.uid);
    if (profileError) return failed('user_profiles', profileError);

    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(user.uid);
    if (authError) return failed('auth user', authError);

    return { success: true };
  } catch (error) {
    console.error('Error deleting account:', error);
    return { success: false, error: 'Failed to delete account' };
  }
}
