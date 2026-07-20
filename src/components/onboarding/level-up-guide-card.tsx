/**
 * Delta-only level-up contextual guide — floating highlight card (TASK-388 §11.3).
 * Prefer sheet highlight over a blocking modal.
 */

'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui';
import { ONBOARDING_COPY } from '@/lib/constants/copy/onboarding-copy';
import { markTutorialMilestone } from '@/lib/onboarding-preferences';
import type { LevelUpGuideContent } from '@/lib/level-up-guide';
import { applyTourHighlight } from '@/lib/sheet-tour-highlight';
import { cn } from '@/lib/utils';

const copy = ONBOARDING_COPY.levelUpGuide;

export interface LevelUpGuideCardProps {
  content: LevelUpGuideContent | null;
  onClose: () => void;
}

export function LevelUpGuideCard({ content, onClose }: LevelUpGuideCardProps) {
  useEffect(() => {
    if (!content?.highlightTarget) return;
    return applyTourHighlight(content.highlightTarget);
  }, [content?.highlightTarget, content?.milestoneId]);

  if (!content) return null;

  const handleDismiss = () => {
    markTutorialMilestone(content.milestoneId);
    onClose();
  };

  return (
    <div
      className={cn(
        'fixed z-overlay left-4 right-4 bottom-20 md:left-auto md:right-4 md:bottom-8 md:w-96',
        'rounded-xl border border-border-light bg-surface shadow-lg p-4'
      )}
      role="dialog"
      aria-labelledby="level-up-guide-title"
      aria-describedby="level-up-guide-body"
    >
      <p className="text-xs text-text-muted dark:text-text-secondary mb-1">
        {copy.titleReady.replace('{level}', String(content.newLevel))}
      </p>
      <h2 id="level-up-guide-title" className="text-base font-semibold text-text-primary">
        {content.title}
      </h2>
      <ul
        id="level-up-guide-body"
        className="mt-2 space-y-1.5 text-sm text-text-secondary list-disc list-inside"
      >
        {content.bullets.map((b) => (
          <li key={b}>{b}</li>
        ))}
      </ul>
      <div className="mt-4 flex justify-end">
        <Button variant="primary" size="sm" onClick={handleDismiss} className="min-h-11">
          {copy.dismiss}
        </Button>
      </div>
    </div>
  );
}
