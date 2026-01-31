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
    const { idToken } = await request.json();
    
    if (!idToken || typeof idToken !== 'string') {
      return NextResponse.json(
        { error: 'ID token is required' },
        { status: 400 }
      );
    }
    
    const result = await createSession(idToken);
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 401 }
      );
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Session creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create session' },
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
