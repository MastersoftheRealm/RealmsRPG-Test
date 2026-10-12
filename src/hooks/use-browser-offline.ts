'use client';

import { useSyncExternalStore } from 'react';

function subscribe(onStoreChange: () => void) {
  window.addEventListener('online', onStoreChange);
  window.addEventListener('offline', onStoreChange);
  return () => {
    window.removeEventListener('online', onStoreChange);
    window.removeEventListener('offline', onStoreChange);
  };
}

function getSnapshot(): boolean {
  return typeof navigator !== 'undefined' && navigator.onLine === false;
}

function getServerSnapshot(): boolean {
  return false;
}

/** True when the browser reports no network (after hydration). */
export function useBrowserOffline(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
