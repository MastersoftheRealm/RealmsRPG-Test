/**
 * Play-together prompt after first character save (TASK-388 §11.1).
 * Used by guided reveal + advanced finalize — not a shared/ui primitive.
 */

'use client';

import { useState } from 'react';
import { Modal, Button, Checkbox } from '@/components/ui';
import { MarketingExternalButton, MarketingLinkButton } from '@/components/landing/marketing-button';
import { DISCORD_URL } from '@/lib/constants/site-copy';
import { ONBOARDING_COPY } from '@/lib/constants/copy/onboarding-copy';
import { markPlayTogetherSeen } from '@/lib/onboarding-preferences';

const copy = ONBOARDING_COPY.playTogether;

export interface PlayTogetherModalProps {
  isOpen: boolean;
  /** Navigate to sheet (or close after create). */
  onViewCharacter: () => void;
  /** User left via campaigns / Discord — character already created; clear wizard if needed. */
  onLeaveElsewhere: () => void;
}

export function PlayTogetherModal({
  isOpen,
  onViewCharacter,
  onLeaveElsewhere,
}: PlayTogetherModalProps) {
  const [dontShowAgain, setDontShowAgain] = useState(true);

  const persistIfNeeded = () => {
    if (dontShowAgain) markPlayTogetherSeen();
  };

  const handleView = () => {
    persistIfNeeded();
    onViewCharacter();
  };

  const handleLeave = () => {
    persistIfNeeded();
    onLeaveElsewhere();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleView}
      title={copy.title}
      description={copy.description}
      fullScreenOnMobile
      footer={
        <div className="flex flex-col gap-3 border-t border-border-light p-4 sm:flex-row sm:items-center sm:justify-between">
          <Checkbox
            id="play-together-dont-show"
            checked={dontShowAgain}
            onChange={(e) => setDontShowAgain(e.target.checked)}
            label={copy.dontShowAgain}
          />
          <Button variant="secondary" onClick={handleView} className="min-h-11">
            {copy.viewCharacter}
          </Button>
        </div>
      }
    >
      <div className="space-y-3 p-4">
        {DISCORD_URL && (
          <MarketingExternalButton
            href={DISCORD_URL}
            size="lg"
            className="w-full"
            onClick={persistIfNeeded}
          >
            {copy.discord}
          </MarketingExternalButton>
        )}
        <MarketingLinkButton
          href="/campaigns"
          variant="outline"
          size="lg"
          className="w-full"
          onClick={handleLeave}
        >
          {copy.campaigns}
        </MarketingLinkButton>
        <MarketingLinkButton
          href="/campaigns?tab=create"
          variant="outline"
          size="lg"
          className="w-full"
          onClick={handleLeave}
        >
          {copy.runGames}
        </MarketingLinkButton>
      </div>
    </Modal>
  );
}
