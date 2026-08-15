/**
 * One-time offer to start the post-save sheet tour (TASK-388 §11.2).
 */

'use client';

import { Modal, Button } from '@/components/ui';
import { ONBOARDING_COPY } from '@/lib/constants/copy/onboarding-copy';
import { setSheetTourStatus } from '@/lib/onboarding-preferences';

const copy = ONBOARDING_COPY.sheetTourOffer;

export interface SheetTourOfferModalProps {
  isOpen: boolean;
  onStart: () => void;
  onDismiss: () => void;
}

export function SheetTourOfferModal({ isOpen, onStart, onDismiss }: SheetTourOfferModalProps) {
  const handleSkip = () => {
    setSheetTourStatus('pending');
    onDismiss();
  };

  const handleNever = () => {
    setSheetTourStatus('dismissed_forever');
    onDismiss();
  };

  const handleStart = () => {
    onStart();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleSkip}
      title={copy.title}
      description={copy.description}
      fullScreenOnMobile
      footer={
        <div className="flex flex-col gap-2 border-t border-border-light sm:flex-row sm:justify-end">
          <Button variant="ghost" onClick={handleNever} className="min-h-11">
            {copy.dontShowAgain}
          </Button>
          <Button variant="secondary" onClick={handleSkip} className="min-h-11">
            {copy.skip}
          </Button>
          <Button variant="primary" onClick={handleStart} className="min-h-11">
            {copy.start}
          </Button>
        </div>
      }
    >
      <div className="p-4 text-sm text-text-secondary">{copy.accountHint}</div>
    </Modal>
  );
}
