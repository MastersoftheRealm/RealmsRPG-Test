/**
 * Play-together prompt after first character save (TASK-388 §11.1).
 * Used by guided reveal + advanced finalize — not a shared/ui primitive.
 */

'use client';

import { useState } from 'react';
import { Modal, Button, Checkbox } from '@/components/ui';
import {
  MarketingExternalButton,
  MarketingLinkButton,
} from '@/components/landing/marketing-button';
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
        <div className="border-t border-border-light">
          <Checkbox
            id="play-together-dont-show"
            checked={dontShowAgain}
            onChange={(e) => setDontShowAgain(e.target.checked)}
            label={copy.dontShowAgain}
          />
        </div>
      }
    >
      <div className="space-y-4 p-4">
        <Button variant="primary" size="lg" className="min-h-11 w-full" onClick={handleView}>
          {copy.viewCharacter}
        </Button>

        <div className="space-y-3 border-t border-border-light pt-4">
          <p className="text-center text-sm font-medium text-text-secondary">
            {copy.secondaryHeading}
          </p>
          <MarketingLinkButton
            href="/campaigns?tab=join"
            variant="outline"
            size="lg"
            className="w-full"
            onClick={handleLeave}
          >
            {copy.campaigns}
          </MarketingLinkButton>
          {DISCORD_URL && (
            <MarketingExternalButton
              href={DISCORD_URL}
              variant="outline"
              size="lg"
              className="w-full"
              onClick={handleLeave}
            >
              {copy.discord}
            </MarketingExternalButton>
          )}
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
      </div>
    </Modal>
  );
}
