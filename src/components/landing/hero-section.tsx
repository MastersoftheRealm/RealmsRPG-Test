/**
 * Landing Hero
 * ============
 * Above-the-fold attention block (REALMS_PRODUCT_OVERVIEW Section 4): one
 * headline, one subline, one dominant primary CTA. Light mode uses soft
 * surface/subtle-primary gradients; dark mode keeps a cinematic primary ramp.
 */

'use client';

import Image from 'next/image';
import { Sparkles, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { useAuth, useCharacters } from '@/hooks';
import { LANDING_COPY } from '@/lib/constants/site-copy';
import { LandingGradientBackdrop } from './landing-gradient-backdrop';
import { LandingDiceDecor } from './landing-dice-decor';
import { MarketingLinkButton } from './marketing-button';

export function HeroSection() {
  const { user } = useAuth();
  const { data: characters } = useCharacters({ enabled: !!user });
  const isReturning = !!user && (characters?.length ?? 0) > 0;

  const copy = LANDING_COPY.hero;

  const headlineClass =
    'font-display text-3xl sm:text-4xl md:text-5xl font-bold max-w-[18ch] text-text-primary dark:text-text-on-dark';
  const sublineClass =
    'font-nunito text-base sm:text-lg md:text-xl max-w-[52ch] text-text-secondary dark:text-text-on-dark/90';
  const returningSublineClass =
    'font-nunito text-base sm:text-lg md:text-xl max-w-[46ch] text-text-secondary dark:text-text-on-dark/90';
  const explorerClass =
    'group inline-flex items-center gap-1.5 text-sm sm:text-base font-medium min-h-[44px] text-primary-link-fg hover:text-primary-fg-hover dark:text-text-on-dark/85 dark:hover:text-text-on-dark underline-offset-4 hover:underline transition-colors';

  return (
    <section
      className={cn(
        'relative w-full',
        'flex items-center justify-center overflow-hidden',
        'bg-gradient-to-br from-background via-primary-subtle-bg to-primary-100',
        'dark:from-primary-900 dark:via-primary-800 dark:to-primary-900'
      )}
    >
      <LandingGradientBackdrop />
      <LandingDiceDecor variant="hero" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-surface to-transparent dark:from-background" aria-hidden="true" />

      <div className="relative z-10 layout-shell-wide w-full px-4 py-10 sm:py-12 md:py-14 flex flex-col items-center text-center gap-4 sm:gap-5">
        {/*
          Wing + wordmark lockup is visually asymmetric: the wing’s airy left sweep
          reads lighter than the “Realms” text, so bbox center feels right-heavy.
          Nudge left for optical alignment with headline/CTA below.
        */}
        <div className="relative w-full max-w-[78vw] sm:max-w-[460px] md:max-w-[520px] -translate-x-[5%] sm:-translate-x-[4%] md:-translate-x-[3.5%]">
          <Image
            src="/images/LogoFull.png"
            alt="Realms"
            width={560}
            height={187}
            className="dark:hidden w-full h-auto object-contain pointer-events-none"
            priority
            suppressHydrationWarning
          />
          <Image
            src="/images/LogoFullGrey.png"
            alt="Realms"
            width={560}
            height={187}
            className="hidden dark:block w-full h-auto object-contain pointer-events-none drop-shadow-lg"
            priority
            suppressHydrationWarning
          />
        </div>

        {isReturning ? (
          <>
            <h1 className={headlineClass}>{copy.returning.headline}</h1>
            <p className={returningSublineClass}>{copy.returning.subline}</p>
            <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4 w-full sm:w-auto">
              <MarketingLinkButton href="/characters" size="xl" className="w-full sm:w-auto">
                <Sparkles className="w-5 h-5 shrink-0" />
                {copy.returning.primaryCta}
              </MarketingLinkButton>
              <MarketingLinkButton
                href="/characters/new"
                variant="outline"
                size="xl"
                className={cn(
                  'w-full sm:w-auto',
                  'border-primary-outline-border text-primary-outline-fg',
                  'dark:border-text-on-dark/80 dark:text-text-on-dark dark:bg-text-on-dark/10 dark:hover:bg-text-on-dark/20'
                )}
              >
                {copy.returning.secondaryCta}
              </MarketingLinkButton>
            </div>
          </>
        ) : (
          <>
            <h1 className={cn(headlineClass, 'max-w-[14ch]')}>{copy.headline}</h1>
            <p className={sublineClass}>{copy.subline}</p>
            <MarketingLinkButton href="/characters/new" size="xl" className="w-full sm:w-auto">
              <Sparkles className="w-5 h-5 shrink-0" />
              {copy.primaryCta}
            </MarketingLinkButton>
            <a href="#how-it-works" className={explorerClass}>
              {copy.explorer}
              <ChevronDown className="w-4 h-4 transition-transform group-hover:translate-y-0.5" />
            </a>
          </>
        )}
      </div>
    </section>
  );
}
