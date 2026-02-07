/**
 * Admin Helpers
 * ==============
 * Server-side utilities for admin role checks.
 * Uses env ADMIN_UIDS or NEXT_PUBLIC_ADMIN_UIDS (comma-separated user IDs).
 */

/**
 * Check if a user ID is an admin.
 * Reads from env ADMIN_UIDS or NEXT_PUBLIC_ADMIN_UIDS (comma-separated).
 * Server-side only — use /api/admin/check for client-side.
 */
export async function isAdmin(uid: string | null | undefined): Promise<boolean> {
  if (!uid) return false;

  const envUids = process.env.ADMIN_UIDS || process.env.NEXT_PUBLIC_ADMIN_UIDS;
  if (!envUids) return false;

  const list = envUids.split(',').map((s) => s.trim()).filter(Boolean);
  return list.includes(uid);
}
