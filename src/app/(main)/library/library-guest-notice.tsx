import Link from 'next/link';
import { LogIn } from 'lucide-react';
import { Button } from '@/components/ui';

/** Signed-out banner on /library (Realms Library browse). Stacks on narrow viewports (86e3ju8jt). */
export function LibraryGuestNotice() {
  return (
    <div
      className="mb-4 flex min-w-0 flex-col gap-3 rounded-lg border border-primary-subtle-border bg-primary-subtle-bg px-4 py-3 text-text-primary sm:flex-row sm:items-center sm:justify-between"
      data-testid="library-guest-notice"
    >
      <p className="min-w-0 flex-1 break-normal">
        You&apos;re browsing the Realms Library. Sign in to see My Library and add items to your
        collection.
      </p>
      <Link href="/login?returnTo=/library" className="shrink-0 self-stretch sm:self-auto">
        <Button variant="primary" size="sm" className="w-full sm:w-auto">
          <LogIn className="h-4 w-4" aria-hidden />
          Sign in
        </Button>
      </Link>
    </div>
  );
}
