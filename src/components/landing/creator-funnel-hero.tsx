/**
 * CreatorFunnelHero
 * =================
 * Shared gradient hero for the character-creation funnel (home → chooser → guided).
 * Matches HeroSection: gradient ramp, dice decor, font-display, layout-shell-wide.
 */

'use client';

import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { LandingGradientBackdrop } from './landing-gradient-backdrop';
import { LandingDiceDecor } from './landing-dice-decor';

export interface CreatorFunnelHeroProps {
  title: string;
  subtitle?: ReactNode;
  /** Small label above the title (e.g. "Guided character creation"). */
  eyebrow?: string;
  actions?: ReactNode;
  /** Chooser uses centered copy; guided creator uses start + optional actions. */
  align?: 'center' | 'start';
  /** Tighter header for in-flow creator (less vertical scroll before content). */
  compact?: boolean;
  className?: string;
}

export function CreatorFunnelHero({
  title,
  subtitle,
  eyebrow,
  actions,
  align = 'start',
  compact = false,
  className,
}: CreatorFunnelHeroProps) {
  const centered = align === 'center';

  return (
    <header
      className={cn(
        'relative overflow-hidden border-b border-border-light',
        'bg-gradient-to-br from-background via-primary-subtle-bg to-primary-100',
        'dark:from-primary-900 dark:via-primary-800 dark:to-primary-900',
        className
      )}
    >
      <LandingGradientBackdrop />
      {!compact && <LandingDiceDecor variant="hero" />}
      <div
        className={cn(
          'pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-background to-transparent dark:from-background',
          compact ? 'h-6' : 'h-10'
        )}
        aria-hidden="true"
      />

      <div
        className={cn(
          'relative z-10 layout-shell-wide px-4',
          compact ? 'py-3 sm:py-4' : 'py-8 sm:py-10 md:py-12',
          centered ? 'text-center' : ''
        )}
      >
        <div
          className={cn(
            'flex flex-col gap-4',
            !centered && 'sm:flex-row sm:items-end sm:justify-between'
          )}
        >
          <div className={cn(centered && 'mx-auto max-w-[46ch]')}>
            {eyebrow && (
              <p className="font-nunito text-sm font-semibold uppercase tracking-wide text-primary-fg">
                {eyebrow}
              </p>
            )}
            <h1
              className={cn(
                'font-display font-bold text-text-primary dark:text-text-on-dark',
                eyebrow ? 'mt-1' : '',
                compact
                  ? 'text-xl sm:text-2xl'
                  : centered
                    ? 'text-3xl sm:text-4xl'
                    : 'text-2xl sm:text-3xl md:text-4xl'
              )}
            >
              {title}
            </h1>
            {subtitle && (
              <p
                className={cn(
                  'mt-1.5 font-nunito text-text-secondary dark:text-text-on-dark/90',
                  compact ? 'text-sm sm:text-base' : 'text-base sm:text-lg',
                  centered ? 'max-w-[46ch] mx-auto' : 'max-w-[52ch]'
                )}
              >
                {subtitle}
              </p>
            )}
          </div>
          {actions && <div className="shrink-0">{actions}</div>}
        </div>
      </div>
    </header>
  );
}
