/**
 * How it works
 * ============
 * Desire block (REALMS_PRODUCT_OVERVIEW Section 4): 2-3 steps from path to play.
 * Holds the `#how-it-works` anchor target for the hero explorer link and repeats
 * the single primary CTA once mid-page (the only sanctioned repeat).
 */

import { Sparkles } from 'lucide-react';
import { LANDING_COPY } from '@/lib/constants/site-copy';
import { MarketingLinkButton } from './marketing-button';

export function HowItWorksSection() {
  const copy = LANDING_COPY.howItWorks;

  return (
    <section
      id="how-it-works"
      className="scroll-mt-20 bg-surface-secondary py-14 sm:py-20"
    >
      <div className="layout-shell-wide px-4">
        <h2 className="text-center font-display text-2xl sm:text-3xl md:text-4xl font-bold text-text-primary mb-10 sm:mb-14">
          {copy.heading}
        </h2>

        <ol className="grid grid-cols-1 md:grid-cols-3 gap-8 sm:gap-10 max-w-5xl mx-auto">
          {copy.steps.map((step, i) => (
            <li key={step.title} className="flex flex-col items-center text-center gap-3">
              <span
                className="flex items-center justify-center w-12 h-12 rounded-pill bg-primary-button text-text-on-dark font-display text-xl font-bold shadow-card"
                aria-hidden="true"
              >
                {i + 1}
              </span>
              <h3 className="font-display text-lg sm:text-xl font-semibold text-text-primary">
                {step.title}
              </h3>
              <p className="font-nunito text-base text-text-secondary leading-relaxed max-w-[34ch]">
                {step.body}
              </p>
            </li>
          ))}
        </ol>

        <div className="mt-12 flex justify-center">
          <MarketingLinkButton href="/characters/new" size="xl" className="w-full sm:w-auto">
            <Sparkles className="w-5 h-5 shrink-0" />
            {LANDING_COPY.hero.primaryCta}
          </MarketingLinkButton>
        </div>
      </div>
    </section>
  );
}
