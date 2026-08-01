/**
 * GuidedStepFooter — landing-cohesive sticky actions for the guided creator.
 * Frosted bar + larger touch targets; distinct from the Advanced creator chrome.
 * Mobile: completionHint sits above Back/Continue (one React mount; CSS reorders on sm+).
 */

'use client';

import type { ReactNode } from 'react';
import { Button } from '@/components/ui';
import { cn } from '@/lib/utils';
import {
  guidedNavPreviousClassName,
  guidedNavProgressClassName,
} from '@/components/shared/guided-choice/guided-nav-button-styles';

export interface GuidedStepFooterProps {
  onBack?: () => void;
  onContinue?: () => void;
  continueLabel?: string;
  backLabel?: string;
  continueDisabled?: boolean;
  backDisabled?: boolean;
  /** Continue as primary (default) or outline previous-tone (e.g. close L2 browse). */
  continueTone?: 'progress' | 'previous';
  primaryAction?: ReactNode;
  /** Optional action to the left of Continue (e.g. Species L3 Create Species). */
  trailingAction?: ReactNode;
  completionHint?: ReactNode;
  className?: string;
}

export function GuidedStepFooter({
  onBack,
  onContinue,
  continueLabel = 'Continue',
  backLabel = 'Back',
  continueDisabled,
  backDisabled,
  continueTone = 'progress',
  primaryAction,
  trailingAction,
  completionHint,
  className,
}: GuidedStepFooterProps) {
  const soloPrimary = Boolean(primaryAction && !onBack && !onContinue);
  const hasHint = completionHint != null && completionHint !== false && completionHint !== '';

  const backButton = onBack ? (
    <Button
      variant="outline"
      onClick={onBack}
      disabled={backDisabled}
      size="lg"
      className={guidedNavPreviousClassName}
    >
      {backLabel}
    </Button>
  ) : null;

  const continueSlot =
    primaryAction ??
    (onContinue ? (
      <Button
        variant={continueTone === 'previous' ? 'outline' : 'primary'}
        onClick={onContinue}
        disabled={continueDisabled}
        size="lg"
        className={
          continueTone === 'previous' ? guidedNavPreviousClassName : guidedNavProgressClassName
        }
      >
        {continueLabel}
      </Button>
    ) : null);

  return (
    <div
      data-testid="guided-step-footer"
      className={cn('fixed bottom-0 inset-x-0 z-30 pointer-events-none', className)}
    >
      <div
        className={cn(
          'pointer-events-auto border-t border-border-light dark:border-border',
          'bg-surface/95 backdrop-blur-md shadow-raised'
        )}
      >
        <div
          className={cn(
            'layout-shell-wide px-4 sm:px-6',
            hasHint ? 'pt-2.5 pb-3 sm:py-4' : 'py-3 sm:py-4'
          )}
        >
          {/*
            One completionHint mount only (same React element must not appear twice).
            Phone: hint above; actions in a row. sm+: back | hint | continue via order.
            REALMS §2.2 / §2.4 — visible step progress on every viewport.
          */}
          <div
            className={cn(
              'flex flex-col gap-2.5',
              'sm:flex-row sm:items-center sm:gap-4',
              soloPrimary ? 'sm:justify-end' : 'sm:justify-between'
            )}
          >
            {hasHint ? (
              <div
                data-testid="guided-step-footer-hint"
                aria-live="polite"
                className={cn(
                  'order-1 text-center text-sm font-nunito text-text-secondary',
                  'sm:order-2 sm:flex-1'
                )}
              >
                {completionHint}
              </div>
            ) : null}

            <div
              className={cn(
                'order-2 flex w-full items-center gap-4',
                soloPrimary ? 'justify-end' : 'justify-between',
                // Promote Back/Continue into the sm row beside the hint.
                hasHint && 'sm:contents'
              )}
            >
              {backButton ? (
                <div className="sm:order-1">{backButton}</div>
              ) : !soloPrimary ? (
                <span className="sm:order-1" aria-hidden />
              ) : null}

              {continueSlot || trailingAction ? (
                <div className="flex items-center gap-3 sm:order-3">
                  {trailingAction}
                  {continueSlot}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
