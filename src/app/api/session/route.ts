/**
 * Session API Route
 * ==================
 * Handles session cookie creation and deletion.
 * 
 * POST - Create session from Firebase ID token
 * DELETE - Clear session cookie
 */

import { NextRequest, NextResponse } from 'next/server';
import { createSession, clearSession } from '@/lib/firebase/session';

/**
 * Create a session cookie from a Firebase ID token.
 * Called by the client after successful Firebase authentication.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);
    
    if (!body || !body.idToken || typeof body.idToken !== 'string') {
      return NextResponse.json(
        { error: 'ID token is required' },
        { status: 400 }
      );
    }
    
    const result = await createSession(body.idToken);
    
    if (!result.success) {
      console.error('Session creation failed:', result.error);
      return NextResponse.json(
        { error: result.error || 'Failed to create session' },
        { status: 401 }
      );
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Session creation error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to create session';
    // In development, surface the real error to help debug credential/config issues
    const isDev = process.env.NODE_ENV !== 'production';
    return NextResponse.json(
      { error: isDev ? errorMessage : 'Internal Server Error' },
      { status: 500 }
    );
  }
}

/**
 * Clear the session cookie.
 * Called by the client on sign out.
 */
export async function DELETE() {
  try {
    await clearSession();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Session deletion error:', error);
    return NextResponse.json(
      { error: 'Failed to clear session' },
      { status: 500 }
    );
  }
}
