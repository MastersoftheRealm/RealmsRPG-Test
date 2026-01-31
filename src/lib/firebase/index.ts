/**
 * Firebase Module Index
 * ======================
 * Re-exports for Firebase utilities
 * 
 * Note: Server modules (server.ts, session.ts) should be imported directly
 * to avoid including server-only code in client bundles:
 * 
 * import { getAdminAuth } from '@/lib/firebase/server';
 * import { getSession } from '@/lib/firebase/session';
 */

// Client-side Firebase (for 'use client' components)
export * from './client';
