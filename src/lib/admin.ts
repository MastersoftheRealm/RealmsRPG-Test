/**
 * Admin Helpers
 * ==============
 * Server-side utilities for admin role checks.
 * Uses Firestore config/admins or env NEXT_PUBLIC_ADMIN_UIDS.
 */

import { getAdminFirestore } from '@/lib/firebase/server';

let cachedAdminUids: string[] | null = null;
let cacheTime = 0;
const CACHE_TTL = 60 * 1000; // 1 minute

/**
 * Check if a user ID is an admin.
 * Reads from Firestore config/admins (uids: string[]) or env NEXT_PUBLIC_ADMIN_UIDS (comma-separated).
 * Server-side only — use /api/admin/check for client-side.
 */
export async function isAdmin(uid: string | null | undefined): Promise<boolean> {
  if (!uid) return false;

  // Env fallback (no Firestore needed)
  const envUids = process.env.NEXT_PUBLIC_ADMIN_UIDS || process.env.ADMIN_UIDS;
  if (envUids) {
    const list = envUids.split(',').map((s) => s.trim()).filter(Boolean);
    return list.includes(uid);
  }

  // Firestore config/admins
  if (cachedAdminUids && Date.now() - cacheTime < CACHE_TTL) {
    return cachedAdminUids.includes(uid);
  }

  try {
    const db = getAdminFirestore();
    const doc = await db.collection('config').doc('admins').get();
    if (!doc.exists) {
      cachedAdminUids = [];
      cacheTime = Date.now();
      return false;
    }
    const data = doc.data();
    const uids = (data?.uids as string[]) || [];
    cachedAdminUids = uids;
    cacheTime = Date.now();
    return uids.includes(uid);
  } catch {
    return false;
  }
}
