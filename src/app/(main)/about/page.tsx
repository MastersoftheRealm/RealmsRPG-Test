/**
 * About Us Page
 * =============
 * Marketing About route — carousel + creator note. Edit prose in about-copy.ts.
 * Server page; only `AboutCarouselSection` is a client island.
 */

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
import { DiscordIcon } from '@/components/patterns/chrome/discord-icon';
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
          'dark:from-primary-900 dark:via-primary-800 dark:to-primary-900',
        )}
      >
        <LandingGradientBackdrop />
        <LandingDiceDecor variant="auth" />
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-background to-transparent dark:from-background"
          aria-hidden="true"
        />
        <div className="layout-shell-wide relative z-10 mx-auto max-w-[var(--container-wide)] px-4 py-10 text-center sm:px-6 sm:py-12 lg:px-8 lg:py-14 lg:text-left">
          <h1 className="mb-3 font-display text-3xl font-bold text-text-primary sm:text-4xl dark:text-text-on-dark">
            {ABOUT_COPY.pageTitle}
          </h1>
          <p className="mx-auto max-w-[58ch] font-nunito text-base text-text-secondary sm:text-lg lg:mx-0 dark:text-text-on-dark/90">
            {ABOUT_COPY.pageDescription}
          </p>
        </div>
      </section>

      <section className="-mt-1 bg-background pt-8 pb-14 sm:pt-10 sm:pb-20">
        <div className="layout-shell-wide mx-auto max-w-[var(--container-wide)] space-y-14 px-4 sm:space-y-16 sm:px-6 lg:px-8">
          <AboutCarouselSection
            slides={CAROUSEL_SLIDES}
            dice={DICE_IMAGES}
            initialIndex={ABOUT_CAROUSEL_CENTER_INDEX}
          />

          <div className="max-w-3xl lg:max-w-none">
            <h2 className="mb-4 font-display text-xl font-bold text-text-primary sm:text-2xl">
              {ABOUT_COPY.creatorNote.heading}
            </h2>
            <p className="mb-4 font-nunito text-lg text-text-muted italic">
              {ABOUT_COPY.creatorNote.greeting}
            </p>
            <p className="mb-4 font-nunito text-base leading-relaxed text-text-secondary sm:text-lg">
              {ABOUT_COPY.creatorNote.bodyLead}{' '}
              <strong className="text-text-primary">{ABOUT_COPY.creatorNote.bodyEmphasis}</strong>.{' '}
              {ABOUT_COPY.creatorNote.bodyTail}
            </p>
            <p className="mb-8 font-nunito text-lg text-text-muted italic">
              {ABOUT_COPY.creatorNote.closing}
              <br />
              <span className="font-semibold text-text-primary not-italic">
                {ABOUT_COPY.creatorNote.authorName}
              </span>
              <br />
              {ABOUT_COPY.creatorNote.authorTitle}
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3 sm:justify-start">
              <MarketingLinkButton href="/characters/new">
                <Sparkles className="h-5 w-5 shrink-0" />
                {LANDING_COPY.hero.primaryCta}
              </MarketingLinkButton>
              <MarketingLinkButton href="/rules" variant="outline">
                <BookOpen className="h-5 w-5 shrink-0" />
                {ABOUT_COPY.ctas.rules}
              </MarketingLinkButton>
              <MarketingExternalButton href={DISCORD_URL} variant="outline">
                <DiscordIcon className="h-5 w-5" />
                {LANDING_COPY.community.cta}
              </MarketingExternalButton>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
