/**
 * Character Creation Entry Chooser
 * ================================
 * Guided / Custom / Legacy — copy in `src/lib/constants/copy/guided-creator-copy.ts`.
 * Custom → cohesive guided creator Path L3; Legacy → transitional tabbed wizard (`/advanced`).
 */

'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Sparkles, SlidersHorizontal, History, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { sanitizeRedirectPath } from '@/lib/safe-redirect';
import { DescriptorChip } from '@/components/ui';
import { CreatorFunnelHero, MarketingLinkButton } from '@/components/landing';
import { GUIDED_CREATOR_COPY } from '@/lib/constants/site-copy';

const { chooser: copy } = GUIDED_CREATOR_COPY;

const MODES = [
  {
    id: 'guided' as const,
    href: '/characters/new/guided?entry=guided',
    ...copy.modes.guided,
    icon: Sparkles,
    showFirstTimerBadge: true,
  },
  {
    id: 'custom' as const,
    // Same cohesive creator; Path L3 custom-archetype entry (REALMS §5.0 / TASK-638).
    href: '/characters/new/guided?entry=custom',
    ...copy.modes.custom,
    icon: SlidersHorizontal,
    showFirstTimerBadge: false,
  },
  {
    id: 'legacy' as const,
    href: '/characters/new/advanced',
    ...copy.modes.legacy,
    icon: History,
    showFirstTimerBadge: false,
  },
];

function withReturnTo(href: string, returnTo: string | null): string {
  if (!returnTo || !returnTo.startsWith('/')) return href;
  // Reject open redirects; keep query (e.g. campaigns?tab=join).
  const safe = sanitizeRedirectPath(returnTo, '');
  if (!safe) return href;
  const sep = href.includes('?') ? '&' : '?';
  return `${href}${sep}returnTo=${encodeURIComponent(safe)}`;
}

export default function NewCharacterChooserPage() {
  const searchParams = useSearchParams();
  const returnTo = searchParams.get('returnTo');

  return (
    <div className="min-h-screen bg-background">
      <CreatorFunnelHero align="center" title={copy.title} subtitle={copy.subtitle} />

      <div className="layout-shell-wide px-4 py-10 sm:py-14">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 max-w-6xl mx-auto">
          {MODES.map((mode) => {
            const Icon = mode.icon;
            return (
              <Link
                key={mode.id}
                href={withReturnTo(mode.href, returnTo)}
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
                    <DescriptorChip variant="primary" size="sm" className="ml-auto shrink-0 whitespace-nowrap font-semibold">
                      {copy.firstTimerBadge}
                    </DescriptorChip>
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
