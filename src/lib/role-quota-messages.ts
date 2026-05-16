/**
 * Role quota error messages
 * =========================
 * Human-readable copy when create flows hit per-role limits from role_policies.
 */

import type { UserRole } from './role-limits';

export const ROLE_LABELS: Record<UserRole, string> = {
  new_player: 'New Player',
  playtester: 'Playtester',
  developer: 'Developer',
  admin: 'Admin',
};

export type RoleQuotaResource =
  | 'characters'
  | 'campaigns'
  | 'custom_powers'
  | 'custom_techniques'
  | 'custom_armaments'
  | 'custom_creatures';

const RESOURCE_PHRASES: Record<
  RoleQuotaResource,
  { item: string; items: string; createVerb: string }
> = {
  characters: { item: 'character', items: 'characters', createVerb: 'create' },
  campaigns: { item: 'campaign', items: 'campaigns', createVerb: 'create' },
  custom_powers: { item: 'custom power', items: 'custom powers', createVerb: 'create' },
  custom_techniques: {
    item: 'custom technique',
    items: 'custom techniques',
    createVerb: 'create',
  },
  custom_armaments: { item: 'custom armament', items: 'custom armaments', createVerb: 'create' },
  custom_creatures: { item: 'custom creature', items: 'custom creatures', createVerb: 'create' },
};

export function formatRoleLabel(role: UserRole | string | null | undefined): string {
  if (!role) return ROLE_LABELS.new_player;
  if (role in ROLE_LABELS) return ROLE_LABELS[role as UserRole];
  return role.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function pluralize(count: number, singular: string, plural: string): string {
  return count === 1 ? singular : plural;
}

/**
 * Message shown when a user hits a role-based quota (403 on create endpoints).
 */
export function formatRoleQuotaExceededMessage(params: {
  role: UserRole | string;
  resource: RoleQuotaResource;
  currentCount: number;
  maxAllowed: number;
}): string {
  const roleLabel = formatRoleLabel(params.role);
  const phrases = RESOURCE_PHRASES[params.resource];
  const itemWord = pluralize(params.maxAllowed, phrases.item, phrases.items);
  const haveWord = pluralize(params.currentCount, phrases.item, phrases.items);

  return (
    `Cannot ${phrases.createVerb} another ${phrases.item}. ` +
    `Your account role is ${roleLabel}, which allows up to ${params.maxAllowed} ${itemWord} ` +
    `(you currently have ${params.currentCount} ${haveWord}). ` +
    `Remove one you no longer need, or open My Account → Role & Limits to review your quotas.`
  );
}

export const ROLE_QUOTA_EXCEEDED_CODE = 'ROLE_QUOTA_EXCEEDED';

export interface RoleQuotaExceededPayload {
  error: string;
  code: typeof ROLE_QUOTA_EXCEEDED_CODE;
  role: string;
  roleLabel: string;
  resource: RoleQuotaResource;
  currentCount: number;
  maxAllowed: number;
}

export function buildRoleQuotaExceededResponse(params: {
  role: UserRole | string;
  resource: RoleQuotaResource;
  currentCount: number;
  maxAllowed: number;
}): RoleQuotaExceededPayload {
  const roleLabel = formatRoleLabel(params.role);
  return {
    error: formatRoleQuotaExceededMessage(params),
    code: ROLE_QUOTA_EXCEEDED_CODE,
    role: params.role,
    roleLabel,
    resource: params.resource,
    currentCount: params.currentCount,
    maxAllowed: params.maxAllowed,
  };
}
