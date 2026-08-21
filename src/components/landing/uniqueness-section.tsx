/**
 * Uniqueness / differentiators
 * ============================
 * Interest + desire block (REALMS_PRODUCT_OVERVIEW Section 4). Fixed-aspect
 * visual proof with image + title links to relevant destinations.
 */

import Link from 'next/link';
import { Sparkles, Wand2, Dices } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { LANDING_COPY } from '@/lib/constants/site-copy';
import { CharacterVarietyTriptych, GearShowcasePanel, RulesBookPanel } from './landing-art-frame';

const ICONS = [Sparkles, Wand2, Dices] as const;

const MEDIA = [
  () => <CharacterVarietyTriptych priority />,
  () => <GearShowcasePanel />,
  () => <RulesBookPanel />,
] as const;

const cardLinkClass =
  'group block rounded-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 focus-visible:ring-offset-surface';

export function UniquenessSection() {
  const copy = LANDING_COPY.uniqueness;

  return (
    <section className="bg-surface py-14 sm:py-20">
      <div className="layout-shell-wide px-4">
        <div className="mx-auto mb-10 max-w-[60ch] text-center sm:mb-14">
          <h2 className="font-display text-2xl font-bold text-text-primary sm:text-3xl md:text-4xl">
            {copy.heading}
          </h2>
          <p className="mt-3 font-nunito text-base text-text-secondary sm:text-lg">
            {copy.subheading}
          </p>
        </div>

        <ul className="grid grid-cols-1 gap-6 sm:gap-8 md:grid-cols-3">
          {copy.items.map((item, i) => {
            const Icon = ICONS[i] ?? Sparkles;
            const Media = MEDIA[i] ?? MEDIA[2];

            return (
              <li
                key={item.title}
                className="flex flex-col gap-4 rounded-card border border-border-light bg-surface-alt/60 p-5 sm:p-6 dark:border-border"
              >
                <Link href={item.href} aria-label={item.linkLabel} className={cardLinkClass}>
                  <div className="duration-base overflow-hidden rounded-card transition-shadow group-hover:shadow-raised">
                    <Media />
                  </div>
                  <div className="mt-4 flex items-center gap-2">
                    <span className="text-primary-link-fg transition-colors group-hover:text-primary-fg-hover">
                      <Icon className="h-5 w-5" aria-hidden="true" />
                    </span>
                    <h3
                      className={cn(
                        'font-display text-lg font-semibold text-text-primary sm:text-xl',
                        'transition-colors group-hover:text-primary-link-fg',
                      )}
                    >
                      {item.title}
                    </h3>
                  </div>
                </Link>
                <p className="font-nunito text-base leading-relaxed text-text-secondary">
                  {item.body}
                </p>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
