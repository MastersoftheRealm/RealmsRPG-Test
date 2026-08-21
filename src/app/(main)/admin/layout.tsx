/**
 * Admin Layout
 * ============
 * Protects admin routes — redirects non-admins.
 */

import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/supabase/session';
import { isAdmin } from '@/lib/admin';

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user } = await getSession();

  if (!user) {
    redirect('/login?returnTo=/admin');
  }

  const admin = await isAdmin(user.uid);
  if (!admin) {
    redirect('/');
  }

  return <>{children}</>;
}
