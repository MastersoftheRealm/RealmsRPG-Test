/**
 * Session API Route
 * ==================
 * Compatibility stub. Supabase handles sessions via middleware and cookies.
 * POST/DELETE return success for any legacy callers.
 */

import { NextResponse } from 'next/server';

export async function POST() {
  return NextResponse.json({ success: true });
}

export async function DELETE() {
  return NextResponse.json({ success: true });
}
