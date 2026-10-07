'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  creatorDraftIsDirty,
  creatorInternalNavigationHref,
} from '@/lib/creator/creator-unsaved-guard';

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

  useEffect(() => {
    if (!isDirty) return;
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      if (leavingRef.current) return;
      event.preventDefault();
      event.returnValue = '';
    };
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
    if (!isDirty) return;
    const creatorUrl = window.location.href;
    window.history.pushState({ creatorUnsavedGuard: true }, '', creatorUrl);
    const onPop = () => {
      if (leavingRef.current) return;
      window.history.pushState({ creatorUnsavedGuard: true }, '', creatorUrl);
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
    window.history.go(-2);
  }, [request]);

  return { request, dismiss, confirm };
}
