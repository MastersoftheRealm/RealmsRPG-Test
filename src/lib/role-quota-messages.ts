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

/** True when a counted resource is at or past its role cap. Unknown caps do not block. */
export function isAtRoleQuota(
  currentCount: number,
  maxAllowed: number | null | undefined,
): boolean {
  if (maxAllowed == null || !Number.isFinite(maxAllowed)) return false;
  return currentCount >= maxAllowed;
}

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

type DbErrorShape = {
  code?: string | undefined;
  message?: string | undefined;
  details?: string | undefined;
};

function isRoleQuotaResource(value: string): value is RoleQuotaResource {
  return (
    value === 'characters' ||
    value === 'campaigns' ||
    value === 'custom_powers' ||
    value === 'custom_techniques' ||
    value === 'custom_armaments' ||
    value === 'custom_creatures'
  );
}

/** Maps `assert_account_create_quota` P0001 failures into the standard 403 payload. */
export function parseRoleQuotaExceededDbError(
  error: DbErrorShape | null | undefined,
): RoleQuotaExceededPayload | null {
  if (!error || error.code !== 'P0001' || error.message !== 'ROLE_QUOTA_EXCEEDED') {
    return null;
  }
  if (!error.details) return null;
  let parsed: unknown;
  try {
    parsed = JSON.parse(error.details);
  } catch {
    return null;
  }
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return null;
  const record = parsed as Record<string, unknown>;
  const resource = record.resource;
  const role = record.role;
  const currentCount = record.currentCount;
  const maxAllowed = record.maxAllowed;
  if (typeof resource !== 'string' || !isRoleQuotaResource(resource)) return null;
  if (typeof role !== 'string') return null;
  if (typeof currentCount !== 'number' || typeof maxAllowed !== 'number') return null;
  return buildRoleQuotaExceededResponse({ role, resource, currentCount, maxAllowed });
}
