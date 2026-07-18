'use client';

import type { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { Header, Footer } from '@/components/layout';
import { MainContentBoundary } from '@/components/layout/main-content-boundary';
import { isMinimalChromeRoute } from '@/lib/routes/funnel-chrome';

export function MainAppChrome({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const minimal = isMinimalChromeRoute(pathname);

  // DESIGN_INTENT: overflow-x-clip here (not on Header) so mid-width chrome cannot
  // widen the document while absolute header menus still paint outside the bar.
  if (minimal) {
    return (
      <div className="min-h-screen min-w-0 flex flex-col bg-background overflow-x-clip">
        <main id="main-content" className="flex-1 min-w-0">
          <MainContentBoundary>{children}</MainContentBoundary>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen min-w-0 flex flex-col bg-background overflow-x-clip">
      <Header />
      <main id="main-content" className="flex-1 min-w-0">
        <MainContentBoundary>{children}</MainContentBoundary>
      </main>
      <Footer />
    </div>
  );
}
