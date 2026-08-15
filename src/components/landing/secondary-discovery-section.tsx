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
        <div className="mx-auto mb-8 max-w-[56ch] text-center sm:mb-12">
          <h2 className="font-display text-2xl font-bold text-text-primary sm:text-3xl">
            {copy.heading}
          </h2>
          <p className="mt-2 font-nunito text-base text-text-secondary sm:text-lg">
            {copy.subheading}
          </p>
        </div>

        <div className="mx-auto grid max-w-4xl grid-cols-1 gap-6 sm:grid-cols-2">
          {cards.map(({ title, body, cta, href, Icon }) => (
            <div
              key={title}
              className="flex flex-col items-center gap-3 rounded-card border border-border-light bg-surface-alt/60 p-6 text-center dark:border-border"
            >
              <span className="text-primary-link-fg">
                <Icon className="h-7 w-7" aria-hidden="true" />
              </span>
              <h3 className="font-display text-lg font-semibold text-text-primary sm:text-xl">
                {title}
              </h3>
              <p className="max-w-[36ch] flex-1 font-nunito text-base leading-relaxed text-text-secondary">
                {body}
              </p>
              <div className="flex w-full justify-center pt-1">
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
