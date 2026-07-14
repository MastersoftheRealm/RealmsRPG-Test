/**
 * About Us Page
 * =============
 * Marketing About route — carousel + creator note. Edit prose in about-copy.ts.
 */

'use client';

import { BookOpen, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import {
  ABOUT_COPY,
  ABOUT_CAROUSEL_SLIDES,
  ABOUT_DICE_ASSETS,
  ABOUT_CAROUSEL_CENTER_INDEX,
  DISCORD_URL,
  LANDING_COPY,
} from '@/lib/constants/site-copy';
import { DiscordIcon } from '@/components/shared/discord-icon';
import {
  MarketingLinkButton,
  MarketingExternalButton,
} from '@/components/landing/marketing-button';
import { LandingGradientBackdrop } from '@/components/landing/landing-gradient-backdrop';
import { LandingDiceDecor } from '@/components/landing/landing-dice-decor';
import { AboutCarouselSection } from '@/components/about/about-carousel-section';
import { AboutSlideBodyView } from '@/components/about/about-slide-body';
import type { AboutCarouselSlide } from '@/components/about/about-carousel-section';

const CAROUSEL_SLIDES: AboutCarouselSlide[] = ABOUT_CAROUSEL_SLIDES.map((slide) => ({
  title: slide.title,
  content: <AboutSlideBodyView body={slide.desktop} />,
  contentMobile: <AboutSlideBodyView body={slide.mobile} compact />,
}));

const DICE_IMAGES = ABOUT_DICE_ASSETS.map((die, i) => ({
  ...die,
  label: ABOUT_CAROUSEL_SLIDES[i]?.title ?? die.alt,
}));

export default function AboutPage() {
  return (
    <>
      <section
        className={cn(
          'relative overflow-hidden',
          'bg-gradient-to-br from-background via-primary-subtle-bg to-primary-100',
          'dark:from-primary-900 dark:via-primary-800 dark:to-primary-900'
        )}
      >
        <LandingGradientBackdrop />
        <LandingDiceDecor variant="auth" />
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-background to-transparent dark:from-background"
          aria-hidden="true"
        />
        <div className="relative z-10 layout-shell-wide mx-auto max-w-[var(--container-wide)] px-4 sm:px-6 lg:px-8 py-10 sm:py-12 lg:py-14 text-center lg:text-left">
          <h1 className="font-display text-3xl sm:text-4xl font-bold text-text-primary dark:text-text-on-dark mb-3">
            {ABOUT_COPY.pageTitle}
          </h1>
          <p className="font-nunito text-base sm:text-lg text-text-secondary dark:text-text-on-dark/90 max-w-[58ch] mx-auto lg:mx-0">
            {ABOUT_COPY.pageDescription}
          </p>
        </div>
      </section>

      <section className="bg-background pb-14 sm:pb-20 pt-8 sm:pt-10 -mt-1">
        <div className="layout-shell-wide mx-auto max-w-[var(--container-wide)] px-4 sm:px-6 lg:px-8 space-y-14 sm:space-y-16">
          <AboutCarouselSection
            slides={CAROUSEL_SLIDES}
            dice={DICE_IMAGES}
            initialIndex={ABOUT_CAROUSEL_CENTER_INDEX}
          />

          <div className="max-w-3xl lg:max-w-none">
            <h2 className="font-display text-xl sm:text-2xl font-bold text-text-primary mb-4">
              {ABOUT_COPY.creatorNote.heading}
            </h2>
            <p className="font-nunito text-lg text-text-muted dark:text-text-secondary italic mb-4">
              {ABOUT_COPY.creatorNote.greeting}
            </p>
            <p className="font-nunito text-base sm:text-lg text-text-secondary leading-relaxed mb-4">
              {ABOUT_COPY.creatorNote.bodyLead}{' '}
              <strong className="text-text-primary">{ABOUT_COPY.creatorNote.bodyEmphasis}</strong>.{' '}
              {ABOUT_COPY.creatorNote.bodyTail}
            </p>
            <p className="font-nunito text-lg text-text-muted dark:text-text-secondary italic mb-8">
              {ABOUT_COPY.creatorNote.closing}
              <br />
              <span className="font-semibold text-text-primary not-italic">
                {ABOUT_COPY.creatorNote.authorName}
              </span>
              <br />
              {ABOUT_COPY.creatorNote.authorTitle}
            </p>
            <div className="flex flex-wrap gap-3 justify-center sm:justify-start items-center">
              <MarketingLinkButton href="/characters/new">
                <Sparkles className="w-5 h-5 shrink-0" />
                {LANDING_COPY.hero.primaryCta}
              </MarketingLinkButton>
              <MarketingLinkButton href="/rules" variant="outline">
                <BookOpen className="w-5 h-5 shrink-0" />
                {ABOUT_COPY.ctas.rules}
              </MarketingLinkButton>
              <MarketingExternalButton href={DISCORD_URL} variant="outline">
                <DiscordIcon className="w-5 h-5" />
                {LANDING_COPY.community.cta}
              </MarketingExternalButton>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
