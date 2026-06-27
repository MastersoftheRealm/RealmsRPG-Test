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
  /** `inline` = button row only (parent provides sticky chrome, e.g. SkillsAllocationPage). */
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
  variant = 'sticky',
  className,
}: CreatorStepFooterProps) {
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
      ) : (
        <span />
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
      className={cn(
        'sticky bottom-3 left-0 right-0 z-sticky mt-8 flex justify-between gap-4',
        'bg-background/95 backdrop-blur rounded-xl shadow-lg py-3 px-4',
        '-mx-4 md:mx-0',
        className
      )}
    >
      {actions}
    </div>
  );
}
