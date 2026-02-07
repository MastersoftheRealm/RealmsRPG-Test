/**
 * Admin Layout
 * ============
 * Protects admin routes — redirects non-admins.
 */

import { redirect } from 'next/navigation';
import { getSession } from '@/lib/supabase/session';
import { isAdmin } from '@/lib/admin';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = await getSession();

  if (!user) {
    redirect('/login');
  }

  const admin = await isAdmin(user.uid);
  if (!admin) {
    redirect('/');
  }

  return <>{children}</>;
}
