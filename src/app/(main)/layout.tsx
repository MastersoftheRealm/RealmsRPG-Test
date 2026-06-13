/**
 * Main App Layout
 * =================
 * Layout for authenticated app pages with header/footer
 */

import { Header, Footer } from '@/components/layout';
import { MainContentBoundary } from '@/components/layout/main-content-boundary';

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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
