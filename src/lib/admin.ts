/**
 * Admin Helpers
 * ==============
 * Server-side utilities for admin role checks.
 * Uses env ADMIN_UIDS (server-only, comma-separated user IDs).
 *
 * SECURITY: Never use NEXT_PUBLIC_ADMIN_UIDS — that exposes admin IDs
 * in the client JS bundle. Only server-side ADMIN_UIDS is read.
 */

/**
 * Check if a user ID is an admin.
 * Reads from server-only env ADMIN_UIDS (comma-separated).
 * Client-side: use /api/admin/check endpoint via useAdmin hook.
 */
export async function isAdmin(uid: string | null | undefined): Promise<boolean> {
  if (!uid) return false;

  const envUids = process.env.ADMIN_UIDS;
  if (!envUids) return false;

  const list = envUids.split(',').map((s) => s.trim()).filter(Boolean);
  return list.includes(uid);
}
