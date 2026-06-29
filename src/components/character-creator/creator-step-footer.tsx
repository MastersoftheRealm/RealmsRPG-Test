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
 * Sticky Back / Continue bar for character creator steps (TASK-285 pattern).
 * Primary action sits on the right; Back on the left.
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
        'mt-auto pt-8 flex gap-4',
        soloPrimary ? 'justify-end' : 'justify-between',
        'border-t border-border-light bg-surface-alt/80 rounded-xl py-3 px-4',
        '-mx-4 md:mx-0',
        className
      )}
    >
      {actions}
    </div>
  );
}
