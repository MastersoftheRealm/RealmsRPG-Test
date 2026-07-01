'use client';

import type { ReactNode } from 'react';
import { Button } from '@/components/ui';
import { cn } from '@/lib/utils';

export interface CreatorStepFooterProps {
  onBack?: () => void;
  onContinue?: () => void;
  continueLabel?: string;
  backLabel?: string;
  continueDisabled?: boolean;
  backDisabled?: boolean;
  /** Replaces the default Continue button (e.g. Create Character). */
  primaryAction?: ReactNode;
  /** Optional completion indicator shown between Back and Continue (e.g. "2 / 3 feats"). */
  completionHint?: ReactNode;
  /** `inline` = button row only (parent provides surrounding chrome). */
  variant?: 'sticky' | 'inline';
  className?: string;
}

/**
 * Fixed Back / Continue controls for character creator steps.
 * Pinned to the viewport bottom (no chrome box) so actions stay reachable while scrolling.
 */
export function CreatorStepFooter({
  onBack,
  onContinue,
  continueLabel = 'Continue →',
  backLabel = '← Back',
  continueDisabled,
  backDisabled,
  primaryAction,
  completionHint,
  variant = 'sticky',
  className,
}: CreatorStepFooterProps) {
  const soloPrimary = Boolean(primaryAction && !onBack && !onContinue);

  const actions = (
    <>
      {onBack ? (
        <Button
          variant="secondary"
          onClick={onBack}
          disabled={backDisabled}
          className="min-h-11 min-w-11"
        >
          {backLabel}
        </Button>
      ) : !soloPrimary ? (
        <span />
      ) : null}
      {completionHint && (
        <div className="hidden sm:flex items-center text-sm text-text-secondary self-center mx-auto">
          {completionHint}
        </div>
      )}
      {primaryAction ??
        (onContinue ? (
          <Button
            onClick={onContinue}
            disabled={continueDisabled}
            className="min-h-11 min-w-11"
          >
            {continueLabel}
          </Button>
        ) : null)}
    </>
  );

  if (variant === 'inline') {
    return (
      <div className={cn('flex justify-between gap-4 w-full', className)}>
        {actions}
      </div>
    );
  }

  return (
    <div
      data-testid="creator-step-footer"
      className={cn(
        'fixed bottom-0 inset-x-0 z-30 pointer-events-none px-4 sm:px-6 lg:px-8 pb-4 pt-2',
        className
      )}
    >
      <div
        className={cn(
          'mx-auto max-w-[var(--container-wide)] lg:px-24 flex gap-4 pointer-events-auto',
          soloPrimary ? 'justify-end' : 'justify-between'
        )}
      >
        {actions}
      </div>
    </div>
  );
}
