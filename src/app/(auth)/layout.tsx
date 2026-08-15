/**
 * Auth Layout
 * ============
 * Branded shell for login/register — matches landing hero gradient and tokens.
 */

import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { cn } from '@/lib/utils/cn';
import { AUTH_COPY } from '@/lib/constants/site-copy';
import { Footer } from '@/components/layout';
import { LandingGradientBackdrop } from '@/components/landing/landing-gradient-backdrop';
import { LandingDiceDecor } from '@/components/landing/landing-dice-decor';

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className={cn(
        'relative flex min-h-screen flex-col overflow-hidden',
        'bg-gradient-to-br from-background via-primary-subtle-bg to-primary-100',
        'dark:from-primary-900 dark:via-primary-800 dark:to-primary-900',
      )}
    >
      <LandingGradientBackdrop />
      <LandingDiceDecor variant="auth" />

      <main
        id="main-content"
        className="relative z-20 flex flex-1 items-center justify-center px-4 py-10 sm:py-12"
      >
        <div className="flex w-full max-w-5xl flex-col items-center gap-10 lg:flex-row lg:gap-16">
          <div className="flex-1 text-center lg:text-left">
            <Link
              href="/"
              className="mx-auto mb-6 inline-block w-full max-w-[300px] -translate-x-[4%] sm:max-w-[360px] sm:-translate-x-[5%] lg:mx-0 lg:max-w-[420px]"
            >
              <Image
                src="/images/LogoFull.png"
                alt="Realms"
                width={560}
                height={187}
                className="h-auto w-full object-contain dark:hidden"
                priority
              />
              <Image
                src="/images/LogoFullGrey.png"
                alt="Realms"
                width={560}
                height={187}
                className="hidden h-auto w-full object-contain drop-shadow-lg dark:block"
                priority
              />
            </Link>
            <p className="mx-auto mb-2 max-w-[22ch] font-display text-xl font-bold text-text-primary sm:text-2xl lg:mx-0 lg:text-3xl dark:text-text-on-dark">
              {AUTH_COPY.headline}
            </p>
            <p className="mx-auto max-w-[42ch] font-nunito text-base text-text-secondary sm:text-lg lg:mx-0 dark:text-text-on-dark/90">
              {AUTH_COPY.subline}
            </p>
          </div>

          <div className="w-full max-w-md">{children}</div>
        </div>
      </main>

      <Footer variant="minimal" tone="auth" className="relative z-20" />
    </div>
  );
}
