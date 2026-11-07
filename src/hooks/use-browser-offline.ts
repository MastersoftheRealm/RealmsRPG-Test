'use client';

import { useSyncExternalStore } from 'react';

export function subscribeBrowserOffline(onStoreChange: () => void): () => void {
  window.addEventListener('online', onStoreChange);
  window.addEventListener('offline', onStoreChange);
  return () => {
    window.removeEventListener('online', onStoreChange);
    window.removeEventListener('offline', onStoreChange);
  };
}

export function getBrowserOfflineSnapshot(): boolean {
  return typeof navigator !== 'undefined' && navigator.onLine === false;
}

function getBrowserOfflineServerSnapshot(): boolean {
  return false;
}

/** True when the browser reports no network (after hydration). */
export function useBrowserOffline(): boolean {
  return useSyncExternalStore(
    subscribeBrowserOffline,
    getBrowserOfflineSnapshot,
    getBrowserOfflineServerSnapshot,
  );
}
