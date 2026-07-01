/**
 * Character Creation Entry Chooser
 * ================================
 * Guided vs Custom — copy in `src/lib/constants/copy/guided-creator-copy.ts`.
 */

'use client';

import Link from 'next/link';
import { Sparkles, SlidersHorizontal, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CreatorFunnelHero, MarketingLinkButton } from '@/components/landing';
import { GUIDED_CREATOR_COPY } from '@/lib/constants/site-copy';

const { chooser: copy } = GUIDED_CREATOR_COPY;

const MODES = [
  {
    id: 'guided' as const,
    href: '/characters/new/guided',
    ...copy.modes.guided,
    icon: Sparkles,
    showFirstTimerBadge: true,
  },
  {
    id: 'custom' as const,
    href: '/characters/new/advanced',
    ...copy.modes.custom,
    icon: SlidersHorizontal,
    showFirstTimerBadge: false,
  },
];

export default function NewCharacterChooserPage() {
  return (
    <div className="min-h-screen bg-background">
      <CreatorFunnelHero align="center" title={copy.title} subtitle={copy.subtitle} />

      <div className="layout-shell-wide px-4 py-10 sm:py-14">
        <div className="grid gap-6 md:grid-cols-2 max-w-4xl mx-auto">
          {MODES.map((mode) => {
            const Icon = mode.icon;
            return (
              <Link
                key={mode.id}
                href={mode.href}
                className={cn(
                  'group flex flex-col gap-4 rounded-card border p-6 sm:p-7 text-left min-h-[16rem]',
                  'bg-surface-alt/60 border-border-light dark:border-border',
                  'transition-shadow duration-base hover:shadow-raised',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 focus-visible:ring-offset-background'
                )}
                aria-label={`${mode.label} character creator: ${mode.tagline}`}
              >
                <div className="flex items-center gap-3 w-full">
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-card bg-primary-subtle-bg text-primary-fg shadow-sm">
                    <Icon className="h-6 w-6" aria-hidden="true" />
                  </span>
                  <span className="font-display text-xl font-semibold text-text-primary group-hover:text-primary-link-fg transition-colors">
                    {mode.label}
                  </span>
                  {mode.showFirstTimerBadge && (
                    <span className="ml-auto shrink-0 whitespace-nowrap rounded-pill bg-primary-subtle-bg px-2.5 py-1 text-xs font-semibold text-primary-fg">
                      {copy.firstTimerBadge}
                    </span>
                  )}
                </div>
                <p className="font-nunito text-sm text-text-secondary">{mode.tagline}</p>
                <ul className="mt-auto space-y-2">
                  {mode.bullets.map((b) => (
                    <li key={b} className="flex items-start gap-2 font-nunito text-sm text-text-secondary">
                      <Check
                        className="mt-0.5 h-4 w-4 shrink-0 text-success-700 dark:text-success-400"
                        aria-hidden="true"
                      />
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
              </Link>
            );
          })}
        </div>

        <div className="mt-10 flex justify-center">
          <MarketingLinkButton href="/" variant="outline" size="lg">
            {copy.backToHome}
          </MarketingLinkButton>
        </div>
      </div>
    </div>
  );
}
