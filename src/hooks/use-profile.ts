/**
 * useProfile Hook
 * ===============
 * Fetches current user's profile for display (Header) and account settings.
 * One react-query cache key — never exposes email/displayName via useProfile().
 */

'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getUserProfileAction } from '@/app/(auth)/actions';
import type { AuthUser } from '@/types/auth';
import { useAuth } from './use-auth';

export interface ProfileDisplay {
  username: string | null;
  photoUrl: string | null;
}

export type UserProfileActionResult = Awaited<ReturnType<typeof getUserProfileAction>>;

/** Shared cache key for getUserProfileAction (Header + My Account). */
export function userProfileQueryKey(userId: string | undefined) {
  return ['user-profile', userId] as const;
}

async function fetchUserProfile(): Promise<UserProfileActionResult> {
  return getUserProfileAction();
}

export function useProfile(): { profile: ProfileDisplay | null; loading: boolean } {
  const { user } = useAuth();
  const userId = user?.uid ?? user?.id;

  const { data, isLoading } = useQuery({
    queryKey: userProfileQueryKey(userId),
    queryFn: fetchUserProfile,
    enabled: !!userId,
    select: (result): ProfileDisplay | null => {
      const p = result.profile;
      if (!p) return null;
      return {
        username:
          (p.usernameDisplay as string | null | undefined) ??
          (p.username as string | null | undefined) ??
          null,
        photoUrl: (p.photoUrl as string | null | undefined) ?? null,
      };
    },
  });

  if (!userId) {
    return { profile: null, loading: false };
  }

  return { profile: data ?? null, loading: isLoading };
}

/** Full account-settings view of the same profile query. */
export interface AccountProfile {
  username?: string;
  email?: string;
  createdAt?: Date;
  photoURL?: string;
  role?: 'new_player' | 'playtester' | 'developer' | 'admin';
  rolePolicy?: {
    maxCampaigns: number;
    maxPlayersPerCampaign: number;
    maxCharacters: number;
    maxPowers: number;
    maxTechniques: number;
    maxArmaments: number;
    maxCreatures: number;
    canUploadProfilePicture: boolean;
  };
}

function mapAccountProfile(
  result: UserProfileActionResult | undefined,
  authUser: AuthUser | null,
): { profile: AccountProfile; loadError: string | null } {
  const fallback: AccountProfile = {
    email: authUser?.email ?? undefined,
    photoURL: authUser?.photoURL ?? undefined,
  };
  if (!result) {
    return { profile: fallback, loadError: null };
  }
  if (result.error) {
    return { profile: fallback, loadError: result.error };
  }
  const p = result.profile;
  if (!p) {
    return { profile: fallback, loadError: null };
  }
  const rawPhoto = (p.photoUrl as string) ?? undefined;
  const photoURL = rawPhoto
    ? `${rawPhoto}?t=${p.updatedAt ? new Date(p.updatedAt as string | number | Date).getTime() : Date.now()}`
    : (authUser?.photoURL ?? undefined);
  return {
    profile: {
      username:
        (p.usernameDisplay as string | undefined) ??
        (p.username as string | undefined) ??
        undefined,
      email: (p.email as string | undefined) ?? authUser?.email ?? undefined,
      createdAt:
        p.createdAt instanceof Date
          ? p.createdAt
          : p.createdAt
            ? new Date(p.createdAt as string | number | Date)
            : undefined,
      photoURL,
      role: (p.role as AccountProfile['role']) ?? undefined,
      rolePolicy: (p.rolePolicy as AccountProfile['rolePolicy']) ?? undefined,
    },
    loadError: null,
  };
}

export function useAccountProfile(authUser: AuthUser | null): {
  profile: AccountProfile | null;
  loading: boolean;
  loadError: string | null;
  retrying: boolean;
  refetch: () => void;
  /** Optimistic patch into the shared user-profile cache (keeps Header in sync). */
  patchProfile: (patch: Partial<AccountProfile>) => void;
} {
  const userId = authUser?.uid ?? authUser?.id;
  const queryClient = useQueryClient();

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: userProfileQueryKey(userId),
    queryFn: fetchUserProfile,
    enabled: !!userId,
  });

  const mapped = mapAccountProfile(data, authUser);
  const loading = !!userId && isLoading && !data;
  const retrying = isFetching && !isLoading;

  const patchProfile = (patch: Partial<AccountProfile>) => {
    if (!userId) return;
    const nextPhoto = patch.photoURL?.split('?')[0];
    queryClient.setQueryData(
      userProfileQueryKey(userId),
      (prev: UserProfileActionResult | undefined) => {
        const existing = prev?.profile;
        const next: UserProfileActionResult = {
          profile: {
            uid: existing?.uid ?? userId,
            id: existing?.id ?? userId,
            email: patch.email ?? existing?.email ?? authUser?.email ?? null,
            displayName: existing?.displayName ?? null,
            username: patch.username ?? existing?.username ?? null,
            usernameDisplay: patch.username ?? existing?.usernameDisplay ?? null,
            photoUrl: nextPhoto ?? existing?.photoUrl ?? authUser?.photoURL ?? null,
            role: patch.role ?? existing?.role ?? null,
            rolePolicy: (patch.rolePolicy ?? existing?.rolePolicy ?? null) as NonNullable<
              UserProfileActionResult['profile']
            >['rolePolicy'],
            lastUsernameChange: existing?.lastUsernameChange ?? null,
            createdAt: patch.createdAt ?? existing?.createdAt ?? null,
            updatedAt: new Date().toISOString(),
          },
          error: null,
        };
        return next;
      },
    );
  };

  return {
    profile: userId ? mapped.profile : null,
    loading,
    loadError: mapped.loadError,
    retrying,
    refetch: () => {
      void refetch();
    },
    patchProfile,
  };
}
