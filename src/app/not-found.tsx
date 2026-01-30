/**
 * 404 Not Found Page
 * ====================
 */

import Link from 'next/link';
import { Button } from '@/components/ui';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="text-center">
        <h1 className="text-9xl font-bold text-neutral-200">404</h1>
        <h2 className="text-2xl font-bold text-text-primary mt-4">Page Not Found</h2>
        <p className="text-text-secondary mt-2 mb-8">
          Sorry, we could not find the page you are looking for.
        </p>
        <Link href="/">
          <Button>Return Home</Button>
        </Link>
      </div>
    </div>
  );
}
