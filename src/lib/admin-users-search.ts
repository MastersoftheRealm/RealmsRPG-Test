/**
 * Admin user directory search — PostgREST filter builder and role label matching.
 */

import type { UserRole } from '@/lib/role-limits';
import { ROLE_LABELS, formatRoleLabel } from '@/lib/role-quota-messages';

export type AdminUserProfileSearchRow = {
  id: string;
  username: string | null;
  username_display: string | null;
  display_name: string | null;
  role: string;
};

/** Escape `\` and `"` for a double-quoted PostgREST filter literal. */
function quotePostgrestFilterValue(value: string): string {
  const escaped = value.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
  return `"${escaped}"`;
}

/** Build a quoted `ilike` pattern (`%search%`) with wildcards escaped for the pattern body. */
export function buildAdminUsersIlikePattern(search: string): string {
  const escaped = search.replace(/[%_\\]/g, (c) => `\\${c}`);
  return quotePostgrestFilterValue(`%${escaped}%`);
}

const ADMIN_USER_ROLES = Object.keys(ROLE_LABELS) as UserRole[];

/** Roles whose display label matches the query (same semantics as the pre-server-search admin UI). */
export function rolesMatchingAdminUserSearchQuery(search: string): UserRole[] {
  const q = search.trim().toLowerCase();
  if (!q) return [];
  return ADMIN_USER_ROLES.filter((role) => formatRoleLabel(role).toLowerCase().includes(q));
}

export function profileMatchesAdminUserSearch(
  profile: AdminUserProfileSearchRow,
  search: string,
): boolean {
  const q = search.trim().toLowerCase();
  if (!q) return true;
  const values = [
    profile.username,
    profile.username_display,
    profile.display_name,
    profile.id,
  ].filter((v): v is string => Boolean(v));
  if (values.some((v) => v.toLowerCase().includes(q))) return true;
  const roleMatches = rolesMatchingAdminUserSearchQuery(search);
  return roleMatches.length > 0 && roleMatches.includes(profile.role as UserRole);
}

/** PostgREST `.or(...)` filter for admin user search across text fields, user id, and role labels. */
export function buildAdminUsersOrFilter(search: string): string {
  const pattern = buildAdminUsersIlikePattern(search);
  const clauses = [
    `username.ilike.${pattern}`,
    `username_display.ilike.${pattern}`,
    `display_name.ilike.${pattern}`,
    `id.ilike.${pattern}`,
  ];
  const roles = rolesMatchingAdminUserSearchQuery(search);
  if (roles.length > 0) {
    clauses.push(`role.in.(${roles.join(',')})`);
  }
  return clauses.join(',');
}

/** Mirrors `order username NULLS LAST`, then `id` as used by the admin users route. */
export function compareAdminUserProfilesForListing(
  a: { id: string; username: string | null },
  b: { id: string; username: string | null },
): number {
  const aNull = a.username === null;
  const bNull = b.username === null;
  if (aNull !== bNull) return aNull ? 1 : -1;
  if (aNull && bNull) return a.id.localeCompare(b.id);
  const byName = (a.username ?? '').localeCompare(b.username ?? '');
  if (byName !== 0) return byName;
  return a.id.localeCompare(b.id);
}
