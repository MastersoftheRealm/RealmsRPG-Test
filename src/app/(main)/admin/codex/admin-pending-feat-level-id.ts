/** Client-only ids for feat levels drafted inside the admin edit modal before save. */

export const ADMIN_PENDING_FEAT_LEVEL_PREFIX = 'pending:';

export function isAdminPendingFeatLevelId(id: string): boolean {
  return id.startsWith(ADMIN_PENDING_FEAT_LEVEL_PREFIX);
}

export function newAdminPendingFeatLevelId(): string {
  return `${ADMIN_PENDING_FEAT_LEVEL_PREFIX}${crypto.randomUUID()}`;
}
