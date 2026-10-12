import type { Metadata } from 'next';
import { MainAppChrome } from '@/components/layout/main-app-chrome';
import { assertCampaignDetailHttpAccess } from '@/lib/server/assert-resource-http-access';

export const metadata: Metadata = {
  title: 'Campaigns',
  description:
    'Create, join, and manage your tabletop RPG campaigns with shared characters and real-time dice rolls.',
};

/**
 * Access runs in this server layout before chrome renders. This segment is
 * outside `(main)/loading.tsx`, so `notFound()` sets HTTP 404 before any bytes stream.
 */
export default async function CampaignDetailLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await assertCampaignDetailHttpAccess(id);
  return <MainAppChrome>{children}</MainAppChrome>;
}
