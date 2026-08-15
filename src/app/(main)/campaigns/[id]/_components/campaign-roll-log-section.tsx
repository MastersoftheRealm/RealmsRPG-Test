/**
 * Campaign roll log section (TASK-666c)
 */

'use client';

import type { RefObject } from 'react';
import { Dices } from 'lucide-react';
import { Alert, Button, EmptyState, LoadingState } from '@/components/ui';
import { RollEntryCard } from '@/components/rolls';
import type { CampaignRollEntry } from '@/types/campaign-roll';

export function CampaignRollLogSection({
  rolls,
  loading,
  isError,
  errorMessage,
  scrollRef,
  onRetry,
}: {
  rolls: CampaignRollEntry[];
  loading: boolean;
  isError: boolean;
  errorMessage?: string;
  scrollRef: RefObject<HTMLDivElement | null>;
  onRetry: () => void;
}) {
  return (
    <div className="mb-6 rounded-xl border border-border-light bg-surface p-6">
      <h2 className="mb-3 flex items-center gap-2 font-semibold text-text-primary">
        <Dices className="h-5 w-5 text-accent-500" />
        Campaign Roll Log
      </h2>
      <p className="mb-4 text-sm text-text-secondary">
        Rolls from all characters in this campaign. Updates in real time.
      </p>
      {isError && (
        <Alert variant="danger" title="Couldn’t load campaign rolls" className="mb-4">
          <p className="mb-3 text-sm">{errorMessage ?? 'Check your connection or try again.'}</p>
          <Button
            type="button"
            variant="outline"
            onClick={onRetry}
            aria-label="Retry loading campaign rolls"
          >
            Retry
          </Button>
        </Alert>
      )}
      <div ref={scrollRef} className="max-h-[400px] overflow-y-auto rounded-lg bg-surface-alt p-2">
        {loading && rolls.length === 0 && !isError ? (
          <LoadingState message="Loading campaign rolls…" />
        ) : rolls.length === 0 && !isError ? (
          <EmptyState
            title="No campaign rolls yet"
            description="Rolls from character sheets will appear here."
            size="sm"
            className="py-10"
          />
        ) : !isError ? (
          // Oldest at top, newest at bottom (API returns newest-first; reverse to match roll log elsewhere)
          [...rolls]
            .reverse()
            .map((roll) => (
              <RollEntryCard key={roll.id} roll={roll} characterName={roll.characterName} />
            ))
        ) : (
          <p className="py-8 text-center text-sm text-text-secondary">
            Fix the error above or tap Retry.
          </p>
        )}
      </div>
    </div>
  );
}
