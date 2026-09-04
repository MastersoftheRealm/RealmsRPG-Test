/**
 * Your Hero leftover review — Create stays clickable; this modal names what is
 * still needed and jumps to the chapter or field (TASK-911).
 */

'use client';

import { ChevronRight } from 'lucide-react';
import { Button, Modal } from '@/components/ui';
import { GUIDED_CREATOR_COPY } from '@/lib/constants/site-copy';
import {
  guidedRevealBlockerKey,
  type GuidedRevealBlocker,
} from '@/lib/guided-creator/reveal-blockers';

const copy = GUIDED_CREATOR_COPY.steps.reveal.review;
const heCopy = GUIDED_CREATOR_COPY.steps.reveal.healthEnergy;

function leftoverDetail(remaining: number, unit: string): string {
  if (remaining > 0) {
    return copy.spendMore(remaining, unit);
  }
  return copy.removeExtra(-remaining, unit);
}

function blockerTitle(blocker: GuidedRevealBlocker): string {
  if (blocker.kind === 'name') return copy.nameItem;
  if (blocker.kind === 'healthEnergy') return copy.healthEnergyItem;
  if (blocker.kind === 'abilityPoints') return copy.abilityPointsItem;
  if (blocker.kind === 'skillPoints') return copy.skillPointsItem;
  return blocker.title;
}

function blockerDetail(blocker: GuidedRevealBlocker): string {
  if (blocker.kind === 'name') return copy.nameDetail;
  if (blocker.kind === 'healthEnergy') return heCopy.allocateHint(blocker.remaining);
  if (blocker.kind === 'abilityPoints') {
    return leftoverDetail(blocker.remaining, copy.abilityPointsUnit);
  }
  if (blocker.kind === 'skillPoints') {
    return leftoverDetail(blocker.remaining, copy.skillPointsUnit);
  }
  return copy.chapterDetail(blocker.title);
}

export interface GuidedRevealReviewModalProps {
  isOpen: boolean;
  blockers: readonly GuidedRevealBlocker[];
  onClose: () => void;
  onSelect: (blocker: GuidedRevealBlocker) => void;
}

export function GuidedRevealReviewModal({
  isOpen,
  blockers,
  onClose,
  onSelect,
}: GuidedRevealReviewModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={copy.title}
      description={copy.description}
      size="md"
      flexLayout
      fullScreenOnMobile
      footer={
        <Button type="button" variant="secondary" size="lg" onClick={onClose}>
          {copy.close}
        </Button>
      }
    >
      <ul className="space-y-2">
        {blockers.map((blocker) => (
          <li key={guidedRevealBlockerKey(blocker)}>
            <button
              type="button"
              className="flex min-h-11 w-full items-center gap-3 rounded-card border border-border-light bg-surface px-4 py-3 text-left hover:bg-surface-alt focus-visible:ring-2 focus-visible:ring-primary-outline-border focus-visible:outline-none dark:border-border"
              onClick={() => onSelect(blocker)}
            >
              <span className="min-w-0 flex-1">
                <span className="block font-nunito text-sm font-semibold text-text-primary">
                  {blockerTitle(blocker)}
                </span>
                <span className="mt-0.5 block font-nunito text-sm font-normal text-text-secondary">
                  {blockerDetail(blocker)}
                </span>
              </span>
              <ChevronRight className="h-4 w-4 shrink-0 text-text-muted" aria-hidden="true" />
            </button>
          </li>
        ))}
      </ul>
    </Modal>
  );
}
