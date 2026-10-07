'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  creatorBackSentinelAction,
  creatorBackSentinelState,
  creatorBeforeUnloadListener,
  creatorDraftIsDirty,
  creatorInternalNavigationHref,
  finishCreatorSentinelRemoval,
  isCreatorBackSentinel,
  stepCreatorBackUntilLeft,
  takeCreatorSentinelRemoval,
} from '@/lib/creator/creator-unsaved-guard';
import { createCreatorDraftDiscard } from '@/lib/game/creator-cache';

/** Tracks the last accepted draft. Call acceptDraft after save, load, or reset. */
export function useCreatorDraftDirty(snapshot: string): {
  isDirty: boolean;
  acceptDraft: () => void;
} {
  const [cleanSnapshot, setCleanSnapshot] = useState(snapshot);
  const [acceptToken, setAcceptToken] = useState(0);
  const [seenToken, setSeenToken] = useState(0);

  if (acceptToken !== seenToken) {
    setSeenToken(acceptToken);
    setCleanSnapshot(snapshot);
  }

  const acceptDraft = useCallback(() => {
    setAcceptToken((token) => token + 1);
  }, []);

  return {
    isDirty: creatorDraftIsDirty(snapshot, acceptToken === seenToken ? cleanSnapshot : snapshot),
    acceptDraft,
  };
}

/** Clears this mount's local draft when the user confirms leaving. A new visit starts over. */
export function useDiscardableCreatorDraft(cacheKey: string): {
  discardLocalDraft: () => void;
  isLocalDraftDiscarded: () => boolean;
} {
  // Pass the factory itself. useState calls it once and keeps that discard for this mount.
  const [discard] = useState(createCreatorDraftDiscard);
  const discardLocalDraft = useCallback(() => {
    discard.discard(cacheKey);
  }, [cacheKey, discard]);
  const isLocalDraftDiscarded = useCallback(() => discard.isDiscarded(), [discard]);
  return { discardLocalDraft, isLocalDraftDiscarded };
}

export type CreatorLeaveRequest = { type: 'href'; href: string } | { type: 'back' };

/**
 * Reload uses beforeunload. Logo and other in-app links use a capture click.
 * Back uses a history sentinel so the SPA does not drop the draft silently.
 */
export function useCreatorLeaveBlocker(isDirty: boolean): {
  request: CreatorLeaveRequest | null;
  dismiss: () => void;
  confirm: () => void;
} {
  const [request, setRequest] = useState<CreatorLeaveRequest | null>(null);
  const leavingRef = useRef(false);
  const removingRef = useRef(false);

  useEffect(() => {
    if (!isDirty) return;
    const onBeforeUnload = creatorBeforeUnloadListener(() => !leavingRef.current);
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [isDirty]);

  useEffect(() => {
    if (!isDirty) return;
    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const target = event.target;
      if (!(target instanceof Element)) return;
      const anchor = target.closest('a');
      if (!anchor) return;
      const href = creatorInternalNavigationHref({
        href: anchor.href,
        target: anchor.getAttribute('target'),
        download: anchor.hasAttribute('download'),
        pageUrl: window.location.href,
      });
      if (!href) return;
      event.preventDefault();
      event.stopPropagation();
      setRequest({ type: 'href', href });
    };
    document.addEventListener('click', onClick, true);
    return () => document.removeEventListener('click', onClick, true);
  }, [isDirty]);

  useEffect(() => {
    const action = creatorBackSentinelAction(isDirty, window.history.state);
    const creatorUrl = window.location.href;
    if (action === 'push') {
      finishCreatorSentinelRemoval();
      window.history.pushState(creatorBackSentinelState(window.history.state), '', creatorUrl);
    } else if (action === 'back' && takeCreatorSentinelRemoval()) {
      removingRef.current = true;
      window.history.back();
    } else if (action === 'none') {
      finishCreatorSentinelRemoval();
    }
    if (!isDirty) return;
    const onPop = () => {
      if (removingRef.current) {
        removingRef.current = false;
        finishCreatorSentinelRemoval();
        return;
      }
      if (leavingRef.current) return;
      if (!isCreatorBackSentinel(window.history.state)) {
        window.history.pushState(creatorBackSentinelState(window.history.state), '', creatorUrl);
      }
      setRequest({ type: 'back' });
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, [isDirty]);

  const dismiss = useCallback(() => setRequest(null), []);

  const confirm = useCallback(() => {
    const pending = request;
    setRequest(null);
    if (!pending) return;
    leavingRef.current = true;
    if (pending.type === 'href') {
      window.location.assign(pending.href);
      return;
    }
    stepCreatorBackUntilLeft(window.history, window.location, (onPop) => {
      window.addEventListener('popstate', onPop);
      return () => window.removeEventListener('popstate', onPop);
    });
  }, [request]);

  return { request, dismiss, confirm };
}
