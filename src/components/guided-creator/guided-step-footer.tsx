/**
 * GuidedStepFooter — landing-cohesive sticky actions for the guided creator.
 * Frosted bar + larger touch targets; distinct from the Advanced creator chrome.
 */

'use client';

import type { ReactNode } from 'react';
import { Button } from '@/components/ui';
import { cn } from '@/lib/utils';

export interface GuidedStepFooterProps {
  onBack?: () => void;
  onContinue?: () => void;
  continueLabel?: string;
  backLabel?: string;
  continueDisabled?: boolean;
  backDisabled?: boolean;
  primaryAction?: ReactNode;
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
  primaryAction,
  completionHint,
  className,
}: GuidedStepFooterProps) {
  const soloPrimary = Boolean(primaryAction && !onBack && !onContinue);

  return (
    <div
      data-testid="guided-step-footer"
      className={cn(
        'fixed bottom-0 inset-x-0 z-30 pointer-events-none',
        className
      )}
    >
      <div
        className={cn(
          'pointer-events-auto border-t border-border-light dark:border-border',
          'bg-surface/95 backdrop-blur-md shadow-raised'
        )}
      >
        <div
          className={cn(
            'layout-shell-wide px-4 sm:px-6 py-3 sm:py-4 flex items-center gap-4',
            soloPrimary ? 'justify-end' : 'justify-between'
          )}
        >
          {onBack ? (
            <Button
              variant="outline"
              onClick={onBack}
              disabled={backDisabled}
              size="lg"
              className={cn(
                'min-h-11',
                'border-primary-outline-border text-primary-outline-fg',
                'dark:border-border dark:text-text-primary'
              )}
            >
              {backLabel}
            </Button>
          ) : !soloPrimary ? (
            <span />
          ) : null}

          {completionHint && (
            <div className="hidden sm:flex items-center text-sm font-nunito text-text-secondary mx-auto">
              {completionHint}
            </div>
          )}

          {primaryAction ??
            (onContinue ? (
              <Button onClick={onContinue} disabled={continueDisabled} size="lg" className="min-h-11">
                {continueLabel}
              </Button>
            ) : null)}
        </div>
      </div>
    </div>
  );
}
