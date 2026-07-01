/**
 * Main App Layout
 * =================
 * Layout for authenticated app pages with header/footer
 */

import { MainAppChrome } from '@/components/layout/main-app-chrome';

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <MainAppChrome>{children}</MainAppChrome>;
}
