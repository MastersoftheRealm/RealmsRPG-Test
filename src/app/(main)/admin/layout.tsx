/**
 * Admin Layout
 * ============
 * Protects admin routes — redirects non-admins.
 */

import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { requireAdminSession } from '@/lib/admin';

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const auth = await requireAdminSession();
  if (!auth.ok) {
    redirect(auth.status === 401 ? '/login?returnTo=/admin' : '/');
  }

  return <>{children}</>;
}
