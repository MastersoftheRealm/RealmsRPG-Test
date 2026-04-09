/**
 * Role Policies
 * =============
 * Database-backed role permissions and quotas with sane static fallbacks.
 */

import { createClient } from '@/lib/supabase/server';
import type { SupabaseClient } from '@supabase/supabase-js';
import { ROLE_LIMITS, type RoleLimits, type UserRole } from './role-limits';

type SupabaseClientLike = SupabaseClient;

export interface RolePolicy extends RoleLimits {
  role: UserRole;
  permissions: Record<string, unknown>;
}

type RolePolicyRow = {
  role: UserRole;
  max_campaigns: number;
  max_players_per_campaign: number;
  max_characters: number;
  max_custom_powers: number;
  max_custom_techniques: number;
  max_custom_armaments: number;
  max_custom_creatures: number;
  permissions: Record<string, unknown> | null;
};

const DEFAULT_ROLE: UserRole = 'new_player';
const ROLE_VALUES: UserRole[] = ['new_player', 'playtester', 'developer', 'admin'];

function isUserRole(value: string | null | undefined): value is UserRole {
  return !!value && ROLE_VALUES.includes(value as UserRole);
}

export function getDefaultRolePolicy(role: UserRole | string | null): RolePolicy {
  const roleCandidate = role ?? undefined;
  const safeRole: UserRole = isUserRole(roleCandidate) ? roleCandidate : DEFAULT_ROLE;
  const limits = ROLE_LIMITS[safeRole];
  return {
    role: safeRole,
    maxCampaigns: limits.maxCampaigns,
    maxPlayersPerCampaign: limits.maxPlayersPerCampaign,
    maxCharacters: limits.maxCharacters,
    maxPowers: limits.maxPowers,
    maxTechniques: limits.maxTechniques,
    maxArmaments: limits.maxArmaments,
    maxCreatures: limits.maxCreatures,
    canUploadProfilePicture: limits.canUploadProfilePicture,
    permissions: {
      can_upload_profile_picture: limits.canUploadProfilePicture,
    },
  };
}

function rowToPolicy(row: RolePolicyRow): RolePolicy {
  const fallback = getDefaultRolePolicy(row.role);
  const permissions = row.permissions ?? fallback.permissions;
  const canUpload =
    typeof permissions.can_upload_profile_picture === 'boolean'
      ? permissions.can_upload_profile_picture
      : fallback.canUploadProfilePicture;

  return {
    role: row.role,
    maxCampaigns: row.max_campaigns,
    maxPlayersPerCampaign: row.max_players_per_campaign,
    maxCharacters: row.max_characters,
    maxPowers: row.max_custom_powers,
    maxTechniques: row.max_custom_techniques,
    maxArmaments: row.max_custom_armaments,
    maxCreatures: row.max_custom_creatures,
    canUploadProfilePicture: canUpload,
    permissions,
  };
}

export async function getRolePolicyForRole(
  role: UserRole | string | null | undefined,
  supabaseClient?: SupabaseClientLike
): Promise<RolePolicy> {
  const safeRole = isUserRole(role) ? role : DEFAULT_ROLE;
  const fallback = getDefaultRolePolicy(safeRole);
  const supabase = supabaseClient ?? (await createClient());
  const { data } = await supabase
    .from('role_policies')
    .select(
      'role, max_campaigns, max_players_per_campaign, max_characters, max_custom_powers, max_custom_techniques, max_custom_armaments, max_custom_creatures, permissions'
    )
    .eq('role', safeRole)
    .maybeSingle();

  if (!data) return fallback;
  return rowToPolicy(data as RolePolicyRow);
}

export async function getRolePolicyForUser(
  uid: string,
  supabaseClient?: SupabaseClientLike
): Promise<RolePolicy> {
  const supabase = supabaseClient ?? (await createClient());
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('role')
    .eq('id', uid)
    .maybeSingle();

  const role = ((profile as { role?: string } | null)?.role ?? DEFAULT_ROLE) as UserRole;
  return getRolePolicyForRole(role, supabase);
}
