import type { Metadata } from 'next';
import { MainAppChrome } from '@/components/layout/main-app-chrome';
import { assertCharacterSheetHttpAccess } from '@/lib/server/assert-resource-http-access';

export const metadata: Metadata = {
  title: 'Characters',
  description: 'Create and manage your tabletop RPG characters.',
};

/**
 * Access runs in this server layout before chrome renders. This segment is
 * outside `(main)/loading.tsx`, so `notFound()` sets HTTP 404 before any bytes stream.
 */
export default async function CharacterSheetLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await assertCharacterSheetHttpAccess(id);
  return <MainAppChrome>{children}</MainAppChrome>;
}
