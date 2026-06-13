/**
 * 404 Not Found Page
 * ====================
 */

import Link from 'next/link';
import { Header, Footer } from '@/components/layout';
import { Button } from '@/components/ui';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main id="main-content" className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="text-center">
          <p className="text-9xl font-bold text-surface select-none" aria-hidden="true">
            404
          </p>
          <h1 className="text-2xl font-bold text-text-primary mt-4">Page Not Found</h1>
          <p className="text-text-secondary mt-2 mb-8">
            Sorry, we could not find the page you are looking for.
          </p>
          <Link href="/">
            <Button>Return Home</Button>
          </Link>
        </div>
      </main>
      <Footer />
    </div>
  );
}
