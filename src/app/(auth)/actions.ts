/**
 * Authentication Server Actions
 * ==============================
 * Server actions for auth (Supabase + Prisma).
 */

'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import { requireAuth, getSession } from '@/lib/supabase/session';
import { prisma } from '@/lib/prisma';
import { isAdmin } from '@/lib/admin';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

/**
 * Sign out — redirect to login. Client must call supabase.auth.signOut() first.
 */
export async function signOutAction() {
  revalidatePath('/', 'layout');
  redirect('/login');
}

/** Generate a unique default username like Player123456 (no private info). */
async function generateDefaultUsername(): Promise<string> {
  const maxAttempts = 20;
  for (let i = 0; i < maxAttempts; i++) {
    const num = Math.floor(100000 + Math.random() * 900000);
    const username = `Player${num}`;
    const existing = await prisma.userProfile.findFirst({
      where: { username: username.toLowerCase() },
    });
    if (!existing) return username.toLowerCase();
  }
  return `Player${Date.now().toString(36)}`;
}

/**
 * Create or update user profile in Prisma.
 * Username: pass to set explicitly, or omit for auto-generated "Player123456" (no email/name for privacy).
 */
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
    await prisma.$transaction([
      prisma.userProfile.upsert({
        where: { id: data.uid },
        create: {
          id: data.uid,
          email: data.email,
          displayName: data.displayName ?? null,
          username: normalized,
        },
        update: {
          email: data.email,
          displayName: data.displayName ?? undefined,
          username: normalized,
        },
      }),
      prisma.usernameLookup.upsert({
        where: { username: normalized },
        create: { username: normalized, userId: data.uid },
        update: { userId: data.uid },
      }),
    ]);
    return { success: true };
  } catch (error) {
    console.error('Error creating user profile:', error);
    return { success: false, error: 'Failed to create user profile' };
  }
}

/**
 * Update the current user's profile.
 */
export async function updateUserProfileAction(data: { displayName?: string; username?: string }) {
  try {
    const user = await requireAuth();
    const updates: { displayName?: string; username?: string; lastUsernameChange?: Date } = {};
    if (data.displayName !== undefined) updates.displayName = data.displayName;
    if (data.username !== undefined) {
      updates.username = data.username.toLowerCase().trim();
      updates.lastUsernameChange = new Date();
    }
    await prisma.userProfile.update({
      where: { id: user.uid },
      data: updates,
    });
    revalidatePath('/my-account');
    return { success: true };
  } catch (error) {
    console.error('Error updating user profile:', error);
    return { success: false, error: 'Failed to update profile' };
  }
}

/**
 * Get the current user's profile.
 */
export async function getUserProfileAction() {
  try {
    const { user } = await getSession();
    if (!user) return { profile: null, error: null };

    const profile = await prisma.userProfile.findUnique({
      where: { id: user.uid },
    });
    return { profile: profile ? { uid: user.uid, ...profile } : null, error: null };
  } catch (error) {
    console.error('Error getting user profile:', error);
    return { profile: null, error: 'Failed to get profile' };
  }
}

/**
 * Check if a username is available.
 */
export async function checkUsernameAvailableAction(username: string) {
  try {
    const normalized = username.toLowerCase().trim();
    const existing = await prisma.userProfile.findFirst({
      where: { username: normalized },
    });
    return { available: !existing };
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

/**
 * Change the current user's username.
 * Admins (ADMIN_UIDS) can change their username without blocklist or rate-limit restrictions.
 */
export async function changeUsernameAction(newUsername: string) {
  try {
    const user = await requireAuth();
    const trimmed = newUsername.trim();
    const normalized = trimmed.toLowerCase();
    const admin = await isAdmin(user.uid);

    if (admin) {
      if (trimmed.length === 0) {
        return { success: false, error: 'Username cannot be empty' };
      }
    } else {
      if (trimmed.length < USERNAME_MIN_LEN) {
        return { success: false, error: `Username must be at least ${USERNAME_MIN_LEN} characters` };
      }
      if (trimmed.length > USERNAME_MAX_LEN) {
        return { success: false, error: `Username must be at most ${USERNAME_MAX_LEN} characters` };
      }
      if (!/^[a-zA-Z0-9_-]+$/.test(trimmed)) {
        return { success: false, error: 'Username can only contain letters, numbers, underscores, and hyphens' };
      }

      const blocked = USERNAME_BLOCKLIST.some((w) => normalized.includes(w));
      if (blocked) return { success: false, error: 'This username is not allowed' };
    }

    const profile = await prisma.userProfile.findUnique({ where: { id: user.uid } });
    const currentUsername = (profile?.username ?? '').toLowerCase();
    if (normalized === currentUsername) {
      return { success: false, error: 'New username is the same as your current username' };
    }

    if (!admin) {
      const lastChange = profile?.lastUsernameChange;
      if (lastChange) {
        const daysSince = (Date.now() - lastChange.getTime()) / (24 * 60 * 60 * 1000);
        if (daysSince < RATE_LIMIT_DAYS) {
          const remaining = Math.ceil(RATE_LIMIT_DAYS - daysSince);
          return { success: false, error: `You can change your username again in ${remaining} day(s)` };
        }
      }
    }

    const taken = await prisma.userProfile.findFirst({
      where: { username: normalized, NOT: { id: user.uid } },
    });
    if (taken) return { success: false, error: 'This username is already taken' };

    await prisma.$transaction([
      ...(currentUsername ? [prisma.usernameLookup.deleteMany({ where: { username: currentUsername } })] : []),
      prisma.usernameLookup.upsert({
        where: { username: normalized },
        create: { username: normalized, userId: user.uid },
        update: { userId: user.uid },
      }),
      prisma.userProfile.update({
        where: { id: user.uid },
        data: { username: normalized, lastUsernameChange: new Date() },
      }),
    ]);

    revalidatePath('/my-account');
    return { success: true };
  } catch (error) {
    console.error('Error changing username:', error);
    return { success: false, error: 'Failed to change username' };
  }
}

/**
 * Delete the current user's account and all data tied to it.
 * Removes: characters, user library (powers/techniques/items/creatures), username lookup,
 * profile, encounters, campaigns owned by user; removes user from campaign membership
 * and campaign character lists where they are a member; then deletes the auth user.
 */
export async function deleteAccountAction() {
  try {
    const user = await requireAuth();
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Remove user from campaigns where they are a member (not owner); remove their characters from campaign
    const campaigns = await prisma.campaign.findMany();
    const memberCampaigns = campaigns.filter((c) => {
      const ids = (c.memberIds as string[]) || [];
      return ids.includes(user.uid) && c.ownerId !== user.uid;
    });
    for (const c of memberCampaigns) {
      const members = ((c.memberIds as string[]) || []).filter((id) => id !== user.uid);
      const chars = ((c.characters as Array<{ userId: string; characterId: string }>) || []).filter(
        (cc) => cc.userId !== user.uid
      );
      await prisma.campaign.update({
        where: { id: c.id },
        data: { memberIds: members, characters: chars },
      });
    }

    await prisma.$transaction([
      prisma.character.deleteMany({ where: { userId: user.uid } }),
      prisma.userPower.deleteMany({ where: { userId: user.uid } }),
      prisma.userTechnique.deleteMany({ where: { userId: user.uid } }),
      prisma.userItem.deleteMany({ where: { userId: user.uid } }),
      prisma.userCreature.deleteMany({ where: { userId: user.uid } }),
      prisma.usernameLookup.deleteMany({ where: { userId: user.uid } }),
      prisma.encounter.deleteMany({ where: { userId: user.uid } }),
      prisma.campaign.deleteMany({ where: { ownerId: user.uid } }),
      prisma.userProfile.delete({ where: { id: user.uid } }),
    ]);

    await supabase.auth.admin.deleteUser(user.uid);
    return { success: true };
  } catch (error) {
    console.error('Error deleting account:', error);
    return { success: false, error: 'Failed to delete account' };
  }
}
