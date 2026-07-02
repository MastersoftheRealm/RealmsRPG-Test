/**
 * Auth Layout
 * ============
 * Branded shell for login/register — matches landing hero gradient and tokens.
 */

import Image from 'next/image';
import Link from 'next/link';
import { cn } from '@/lib/utils/cn';
import { AUTH_COPY } from '@/lib/constants/site-copy';
import { Footer } from '@/components/layout';
import { LandingGradientBackdrop } from '@/components/landing/landing-gradient-backdrop';
import { LandingDiceDecor } from '@/components/landing/landing-dice-decor';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        'min-h-screen flex flex-col relative overflow-hidden',
        'bg-gradient-to-br from-background via-primary-subtle-bg to-primary-100',
        'dark:from-primary-900 dark:via-primary-800 dark:to-primary-900'
      )}
    >
      <LandingGradientBackdrop />
      <LandingDiceDecor variant="auth" />

      <main
        id="main-content"
        className="relative z-20 flex-1 flex items-center justify-center px-4 py-10 sm:py-12"
      >
        <div className="w-full max-w-5xl flex flex-col lg:flex-row items-center gap-10 lg:gap-16">
          <div className="flex-1 text-center lg:text-left">
            <Link
              href="/"
              className="inline-block mb-6 w-full max-w-[300px] sm:max-w-[360px] lg:max-w-[420px] mx-auto lg:mx-0 -translate-x-[4%] sm:-translate-x-[5%]"
            >
              <Image
                src="/images/LogoFull.png"
                alt="Realms"
                width={560}
                height={187}
                className="dark:hidden w-full h-auto object-contain"
                priority
              />
              <Image
                src="/images/LogoFullGrey.png"
                alt="Realms"
                width={560}
                height={187}
                className="hidden dark:block w-full h-auto object-contain drop-shadow-lg"
                priority
              />
            </Link>
            <p className="font-display text-xl sm:text-2xl lg:text-3xl font-bold text-text-primary dark:text-text-on-dark mb-2 max-w-[22ch] mx-auto lg:mx-0">
              {AUTH_COPY.headline}
            </p>
            <p className="font-nunito text-base sm:text-lg text-text-secondary dark:text-text-on-dark/90 max-w-[42ch] mx-auto lg:mx-0">
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
