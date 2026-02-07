/**
 * Admin Check API
 * ================
 * Returns whether the current session user is an admin.
 */

import { NextResponse } from 'next/server';
import { getSession } from '@/lib/supabase/session';
import { isAdmin } from '@/lib/admin';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const { user } = await getSession();
    if (!user?.uid) {
      return NextResponse.json({ isAdmin: false });
    }
    const admin = await isAdmin(user.uid);
    return NextResponse.json({ isAdmin: admin });
  } catch {
    return NextResponse.json({ isAdmin: false });
  }
}
