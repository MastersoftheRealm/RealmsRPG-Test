/**
 * When the player entered via Custom chooser (no path), land on deeper catalog
 * faces the first time each sub-step is entered (Continue / chapter rail).
 */

import { useEffect, useRef } from 'react';
import type { GuidedDraft } from '@/stores/guided-creator-store';
import { shouldApplyGuidedDeepEntryOnArrival } from '@/lib/guided-creator/guided-deep-entry-landing';
import type { GuidedNavigationIntent } from '@/lib/guided-creator/guided-substep-nav';

export function useGuidedDeepEntryOnArrival(args: {
  draft: Pick<GuidedDraft, 'creatorEntryMode' | 'archetypePathId'>;
  navigationIntent: GuidedNavigationIntent;
  entryNonce: number;
  onDeepEntry: () => void;
  /** Gate until catalogs are ready (e.g. species list loaded). */
  enabled?: boolean | undefined;
}): void {
  const lastNonce = useRef<number | null>(null);
  const { draft, navigationIntent, entryNonce, onDeepEntry, enabled = true } = args;

  useEffect(() => {
    if (
      !shouldApplyGuidedDeepEntryOnArrival({
        draft,
        navigationIntent,
        entryNonce,
        lastAppliedEntryNonce: lastNonce.current,
        enabled,
      })
    ) {
      return;
    }
    lastNonce.current = entryNonce;
    onDeepEntry();
  }, [draft, navigationIntent, entryNonce, onDeepEntry, enabled]);
}
