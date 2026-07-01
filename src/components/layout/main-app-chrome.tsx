'use client';

import type { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { Header, Footer } from '@/components/layout';
import { MainContentBoundary } from '@/components/layout/main-content-boundary';
import { isMinimalChromeRoute } from '@/lib/routes/funnel-chrome';

export function MainAppChrome({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const minimal = isMinimalChromeRoute(pathname);

  if (minimal) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <main id="main-content" className="flex-1">
          <MainContentBoundary>{children}</MainContentBoundary>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main id="main-content" className="flex-1">
        <MainContentBoundary>{children}</MainContentBoundary>
      </main>
      <Footer />
    </div>
  );
}
