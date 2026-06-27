/**
 * 404 Not Found Page
 * ====================
 */

import Link from 'next/link';
import { Header, Footer } from '@/components/layout';
import { Button, PageHeader } from '@/components/ui';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main id="main-content" className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="text-center w-full max-w-md">
          <p className="text-9xl font-bold text-surface select-none" aria-hidden="true">
            404
          </p>
          <PageHeader
            title="Page Not Found"
            size="sm"
            className="mt-4 mb-0 [&_h1]:justify-center"
            description="Sorry, we could not find the page you are looking for."
          />
          <div className="mt-8">
            <Link href="/">
              <Button>Return Home</Button>
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
