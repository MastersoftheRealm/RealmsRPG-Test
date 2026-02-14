/**
 * Role Limits
 * ============
 * Per-role limits for characters, library items, campaigns, and campaign members.
 * Admin: no limits (and only assignable via env ADMIN_UIDS).
 */

export type UserRole = 'new_player' | 'playtester' | 'developer' | 'admin';

export interface RoleLimits {
  maxCharacters: number;
  maxPowers: number;
  maxTechniques: number;
  maxArmaments: number;
  maxCreatures: number;
  maxCampaigns: number;
  maxPlayersPerCampaign: number;
  canUploadProfilePicture: boolean;
}

export const ROLE_LIMITS: Record<UserRole, RoleLimits> = {
  new_player: {
    maxCharacters: 3,
    maxPowers: 20,
    maxTechniques: 20,
    maxArmaments: 15,
    maxCreatures: 10,
    maxCampaigns: 1,
    maxPlayersPerCampaign: 5,
    canUploadProfilePicture: false,
  },
  playtester: {
    maxCharacters: 6,
    maxPowers: 35,
    maxTechniques: 35,
    maxArmaments: 25,
    maxCreatures: 25,
    maxCampaigns: 3,
    maxPlayersPerCampaign: 7,
    canUploadProfilePicture: true,
  },
  developer: {
    maxCharacters: 15,
    maxPowers: 100,
    maxTechniques: 100,
    maxArmaments: 80,
    maxCreatures: 100,
    maxCampaigns: 8,
    maxPlayersPerCampaign: 12,
    canUploadProfilePicture: true,
  },
  admin: {
    maxCharacters: 9999,
    maxPowers: 9999,
    maxTechniques: 9999,
    maxArmaments: 9999,
    maxCreatures: 9999,
    maxCampaigns: 9999,
    maxPlayersPerCampaign: 9999,
    canUploadProfilePicture: true,
  },
};

export function getLimitsForRole(role: UserRole | string | null): RoleLimits {
  const r = (role ?? 'new_player') as UserRole;
  return ROLE_LIMITS[r] ?? ROLE_LIMITS.new_player;
}

/** Resolve effective role: if uid is in ADMIN_UIDS, treat as admin for limits. */
export function getEffectiveRole(
  role: UserRole | string | null,
  uid: string | null,
  adminUids: string[]
): UserRole {
  if (uid && adminUids.includes(uid)) return 'admin';
  return (role as UserRole) ?? 'new_player';
}
