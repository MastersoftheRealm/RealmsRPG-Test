'use client';

/**
 * ?edit= may discard a creator draft only after that id is found in the library.
 * An unknown id keeps the draft and tells the user the row couldn't be found.
 */

import { useEffect, useRef, useState } from 'react';
import { clearCreatorCache } from '@/lib/game/creator-cache';
import { creatorEditMissMessage } from '@/lib/library/catalog-listing';

/**
 * Latch the lookup once `settled` is true. Power, technique, armament, and
 * empowered technique mount the workspace only after the library query settles,
 * so they pass `settled: true`. Creature passes `settled` when its bootstrap runs.
 * `replacesDraft` is `creatorEditReplacesDraft`: true only for a confirmed id.
 */
export function useCreatorEditDraftDecision(
  settled: boolean,
  replacesDraft: boolean,
  cacheKey: string,
): { discardDraft: boolean } {
  const [decision, setDecision] = useState<'pending' | 'discard' | 'keep'>('pending');
  if (settled && decision === 'pending') {
    setDecision(replacesDraft ? 'discard' : 'keep');
  }
  const discardDraft = decision === 'discard';

  useEffect(() => {
    if (!discardDraft) return;
    clearCreatorCache(cacheKey);
  }, [discardDraft, cacheKey]);

  return { discardDraft };
}

export function useCreatorEditMissNotice(
  active: boolean,
  kind: string,
  setSaveMessage: (message: { type: 'success' | 'error'; text: string } | null) => void,
): void {
  const noted = useRef(false);
  useEffect(() => {
    if (!active || noted.current) return;
    noted.current = true;
    setSaveMessage({ type: 'error', text: creatorEditMissMessage(kind) });
  }, [active, kind, setSaveMessage]);
}
