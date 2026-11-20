'use client';

import type { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { Header, Footer } from '@/components/layout';
import { MainContentBoundary } from '@/components/layout/main-content-boundary';
import { isMinimalChromeRoute } from '@/lib/routes/funnel-chrome';
import { CharacterAutosaveBaselineProvider } from '@/lib/character/character-autosave-baseline-context';

export function MainAppChrome({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const minimal = isMinimalChromeRoute(pathname);

  // DESIGN_INTENT: overflow-x-clip here (not on Header) so mid-width chrome cannot
  // widen the document while absolute header menus still paint outside the bar.
  if (minimal) {
    return (
      <div className="flex min-h-screen min-w-0 flex-col overflow-x-clip bg-background">
        <main id="main-content" className="min-w-0 flex-1">
        <MainContentBoundary>
          <CharacterAutosaveBaselineProvider>{children}</CharacterAutosaveBaselineProvider>
        </MainContentBoundary>
      </main>
    </div>
  );
}

  return (
    <div className="flex min-h-screen min-w-0 flex-col overflow-x-clip bg-background">
      <Header />
      <main id="main-content" className="min-w-0 flex-1">
        <MainContentBoundary>
          <CharacterAutosaveBaselineProvider>{children}</CharacterAutosaveBaselineProvider>
        </MainContentBoundary>
      </main>
      <Footer />
    </div>
  );
}
