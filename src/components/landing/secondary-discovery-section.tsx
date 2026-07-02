/**
 * Secondary discovery (below the fold)
 * ====================================
 * Customizer-facing CTAs (REALMS_PRODUCT_OVERVIEW Section 4): custom power +
 * weapons/armor. Visually subordinate to the hero CTA (outline buttons).
 */

import { Wand2, Hammer } from 'lucide-react';
import { LANDING_COPY } from '@/lib/constants/site-copy';
import { MarketingLinkButton } from './marketing-button';

export function SecondaryDiscoverySection() {
  const copy = LANDING_COPY.secondaryDiscovery;

  const cards = [
    { ...copy.power, href: '/power-creator', Icon: Wand2 },
    { ...copy.item, href: '/item-creator', Icon: Hammer },
  ];

  return (
    <section className="bg-surface py-14 sm:py-20">
      <div className="layout-shell-wide px-4">
        <div className="text-center max-w-[56ch] mx-auto mb-8 sm:mb-12">
          <h2 className="font-display text-2xl sm:text-3xl font-bold text-text-primary">
            {copy.heading}
          </h2>
          <p className="mt-2 font-nunito text-base sm:text-lg text-text-secondary">
            {copy.subheading}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {cards.map(({ title, body, cta, href, Icon }) => (
            <div
              key={title}
              className="flex flex-col items-center text-center gap-3 rounded-card bg-surface-alt/60 p-6 border border-border-light dark:border-border"
            >
              <span className="text-primary-link-fg">
                <Icon className="w-7 h-7" aria-hidden="true" />
              </span>
              <h3 className="font-display text-lg sm:text-xl font-semibold text-text-primary">
                {title}
              </h3>
              <p className="font-nunito text-base text-text-secondary leading-relaxed flex-1 max-w-[36ch]">
                {body}
              </p>
              <div className="pt-1 w-full flex justify-center">
                <MarketingLinkButton href={href} variant="outline">
                  {cta}
                </MarketingLinkButton>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
