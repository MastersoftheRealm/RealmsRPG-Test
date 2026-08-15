/**
 * How it works
 * ============
 * Desire block (REALMS_PRODUCT_OVERVIEW Section 4): create a character → find a
 * table (Discord) → start playing. Holds the `#how-it-works` anchor target for
 * the hero explorer link and repeats the single primary CTA once mid-page
 * (the only sanctioned repeat).
 */

import { Sparkles } from 'lucide-react';
import { LANDING_COPY } from '@/lib/constants/site-copy';
import { MarketingLinkButton } from './marketing-button';

export function HowItWorksSection() {
  const copy = LANDING_COPY.howItWorks;

  return (
    <section id="how-it-works" className="scroll-mt-20 bg-surface-secondary py-14 sm:py-20">
      <div className="layout-shell-wide px-4">
        <h2 className="mb-10 text-center font-display text-2xl font-bold text-text-primary sm:mb-14 sm:text-3xl md:text-4xl">
          {copy.heading}
        </h2>

        <ol className="mx-auto grid max-w-5xl grid-cols-1 gap-8 sm:gap-10 md:grid-cols-3">
          {copy.steps.map((step, i) => (
            <li key={step.title} className="flex flex-col items-center gap-3 text-center">
              <span
                className="flex h-12 w-12 items-center justify-center rounded-pill bg-primary-button font-display text-xl font-bold text-text-on-dark shadow-card"
                aria-hidden="true"
              >
                {i + 1}
              </span>
              <h3 className="font-display text-lg font-semibold text-text-primary sm:text-xl">
                {step.title}
              </h3>
              <p className="max-w-[34ch] font-nunito text-base leading-relaxed text-text-secondary">
                <HowItWorksStepBody step={step} />
              </p>
            </li>
          ))}
        </ol>

        <div className="mt-12 flex justify-center">
          <MarketingLinkButton href="/characters/new" size="xl" className="w-full sm:w-auto">
            <Sparkles className="h-5 w-5 shrink-0" />
            {LANDING_COPY.hero.primaryCta}
          </MarketingLinkButton>
        </div>
      </div>
    </section>
  );
}

function HowItWorksStepBody({ step }: { step: (typeof LANDING_COPY.howItWorks.steps)[number] }) {
  const href = 'href' in step ? step.href : undefined;
  const linkLabel = 'linkLabel' in step ? step.linkLabel : undefined;
  if (href && linkLabel) {
    const idx = step.body.indexOf(linkLabel);
    if (idx >= 0) {
      return (
        <>
          {step.body.slice(0, idx)}
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Join the Discord (opens in a new tab)"
            className="font-medium text-primary-link-fg underline-offset-4 hover:text-primary-fg-hover hover:underline"
          >
            {linkLabel}
          </a>
          {step.body.slice(idx + linkLabel.length)}
        </>
      );
    }
  }
  return step.body;
}
