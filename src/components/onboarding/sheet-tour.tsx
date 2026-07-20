/**
 * Lightweight sheet tour — highlight chain + step card (TASK-388 §11.2).
 */

'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui';
import { ONBOARDING_COPY } from '@/lib/constants/copy/onboarding-copy';
import { setSheetTourStatus } from '@/lib/onboarding-preferences';
import { applyTourHighlight } from '@/lib/sheet-tour-highlight';
import { cn } from '@/lib/utils';

const copy = ONBOARDING_COPY.sheetTour;

export interface SheetTourProps {
  active: boolean;
  onComplete: () => void;
}

export function SheetTour({ active, onComplete }: SheetTourProps) {
  const [stepIndex, setStepIndex] = useState(0);
  const [wasActive, setWasActive] = useState(false);
  const steps = copy.steps;
  const step = steps[stepIndex];
  const isLast = stepIndex >= steps.length - 1;

  if (!active && wasActive) {
    setStepIndex(0);
    setWasActive(false);
  } else if (active && !wasActive) {
    setWasActive(true);
  }

  useEffect(() => {
    if (!active || !step) return;
    return applyTourHighlight(step.target);
  }, [active, step, stepIndex]);

  if (!active || !step) return null;

  const finish = () => {
    setSheetTourStatus('completed');
    onComplete();
  };

  return (
    <div
      className={cn(
        'fixed z-overlay left-4 right-4 bottom-20 md:left-auto md:right-4 md:bottom-8 md:w-96',
        'rounded-xl border border-border-light bg-surface shadow-lg p-4'
      )}
      role="dialog"
      aria-labelledby="sheet-tour-title"
      aria-describedby="sheet-tour-body"
    >
      <p className="text-xs text-text-muted dark:text-text-secondary mb-1">
        Sheet tour · {stepIndex + 1} / {steps.length}
      </p>
      <h2 id="sheet-tour-title" className="text-base font-semibold text-text-primary">
        {step.title}
      </h2>
      <p id="sheet-tour-body" className="mt-1 text-sm text-text-secondary">
        {step.body}
      </p>
      <div className="mt-4 flex flex-wrap gap-2 justify-between">
        <Button variant="ghost" size="sm" onClick={finish} className="min-h-11">
          {copy.skip}
        </Button>
        <div className="flex gap-2">
          {stepIndex > 0 && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setStepIndex((i) => Math.max(0, i - 1))}
              className="min-h-11"
            >
              {copy.back}
            </Button>
          )}
          <Button
            variant="primary"
            size="sm"
            className="min-h-11"
            onClick={() => {
              if (isLast) {
                finish();
              } else {
                setStepIndex((i) => i + 1);
              }
            }}
          >
            {isLast ? copy.done : copy.next}
          </Button>
        </div>
      </div>
    </div>
  );
}
