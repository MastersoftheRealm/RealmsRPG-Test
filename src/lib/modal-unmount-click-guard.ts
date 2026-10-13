'use client';

import { useEffect, useRef } from 'react';
import { bindModalCloseClickSink, MODAL_CLOSE_CLICK_CAPTURE_MS } from '@/lib/modal-close-click';

/**
 * A sheet modal that unmounts on close never paints its own click shield.
 * Arm the same one-click sink from the parent that stays mounted.
 */
export function armModalUnmountClickGuard(target: EventTarget): () => void {
  let removed = false;
  const unbind = bindModalCloseClickSink(target, () => {
    removed = true;
  });
  const id = setTimeout(() => {
    if (!removed) unbind();
  }, MODAL_CLOSE_CLICK_CAPTURE_MS);
  return () => {
    clearTimeout(id);
    if (!removed) unbind();
  };
}

/** True on the close transition, when the next click would otherwise hit the page. */
export function modalUnmountShouldArmGuard(wasOpen: boolean, isOpen: boolean): boolean {
  return wasOpen && !isOpen;
}

export function useModalUnmountClickGuard(open: boolean) {
  const wasOpenRef = useRef(false);
  useEffect(() => {
    const wasOpen = wasOpenRef.current;
    wasOpenRef.current = open;
    if (!modalUnmountShouldArmGuard(wasOpen, open)) return;
    return armModalUnmountClickGuard(window);
  }, [open]);
}
