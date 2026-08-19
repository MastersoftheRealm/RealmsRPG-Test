'use client';

import type { ReactNode } from 'react';
import { Button } from '@/components/ui';
import { cn } from '@/lib/utils';

export interface CreatorStepFooterProps {
  onBack?: (() => void) | undefined;
  onContinue?: (() => void) | undefined;
  continueLabel?: string | undefined;
  backLabel?: string | undefined;
  continueDisabled?: boolean | undefined;
  backDisabled?: boolean | undefined;
  /** Replaces the default Continue button (e.g. Create Character). */
  primaryAction?: ReactNode | undefined;
  /** Optional completion indicator shown between Back and Continue (e.g. "2 / 3 feats"). */
  completionHint?: ReactNode | undefined;
  /** `inline` = button row only (parent provides surrounding chrome). */
  variant?: 'sticky' | 'inline' | undefined;
  className?: string | undefined;
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
        <div className="mx-auto hidden items-center self-center text-sm text-text-secondary sm:flex">
          {completionHint}
        </div>
      )}
      {primaryAction ??
        (onContinue ? (
          <Button onClick={onContinue} disabled={continueDisabled} className="min-h-11 min-w-11">
            {continueLabel}
          </Button>
        ) : null)}
    </>
  );

  if (variant === 'inline') {
    return <div className={cn('flex w-full justify-between gap-4', className)}>{actions}</div>;
  }

  return (
    <div
      data-testid="creator-step-footer"
      className={cn(
        'pointer-events-none fixed inset-x-0 bottom-0 z-30 px-4 pt-2 pb-4 sm:px-6 lg:px-8',
        className,
      )}
    >
      <div
        className={cn(
          'pointer-events-auto mx-auto flex max-w-[var(--container-wide)] gap-4 lg:px-24',
          soloPrimary ? 'justify-end' : 'justify-between',
        )}
      >
        {actions}
      </div>
    </div>
  );
}
