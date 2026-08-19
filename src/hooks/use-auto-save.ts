/**
 * useAutoSave Hook
 * ================
 * Provides debounced auto-save functionality for forms.
 * Tracks changes and saves after a delay to reduce server calls.
 */

import { useState, useEffect, useCallback, useRef } from 'react';

export const AUTOSAVE_RETRY_DELAYS_MS = [2_000, 5_000, 15_000, 60_000] as const;

/** Backoff after a failed save; capped at the last slot (60s). */
export function nextAutosaveRetryDelayMs(failedAttemptIndex: number): number {
  const last = AUTOSAVE_RETRY_DELAYS_MS.length - 1;
  const idx = Math.min(Math.max(0, failedAttemptIndex), last);
  return AUTOSAVE_RETRY_DELAYS_MS[idx]!;
}

interface AutoSaveOptions<T> {
  /** Data to watch for changes */
  data: T;
  /** Function to call when saving */
  onSave: (data: T) => Promise<void>;
  /** Debounce delay in milliseconds (default: 2000) */
  delay?: number | undefined;
  /** Whether auto-save is enabled (default: true) */
  enabled?: boolean | undefined;
  /** Callback when save starts */
  onSaveStart?: (() => void) | undefined;
  /** Callback when save completes */
  onSaveComplete?: (() => void) | undefined;
  /** Callback when save fails */
  onSaveError?: ((error: Error) => void) | undefined;
}

interface AutoSaveResult {
  /** Whether there are unsaved changes */
  hasUnsavedChanges: boolean;
  /** Whether currently saving */
  isSaving: boolean;
  /** Last save timestamp */
  lastSaved: Date | null;
  /** Force an immediate save */
  saveNow: () => Promise<void>;
  /** Mark as saved without calling onSave */
  markSaved: () => void;
  /** Reset dirty state */
  reset: () => void;
}

export function useAutoSave<T>({
  data,
  onSave,
  delay = 2000,
  enabled = true,
  onSaveStart,
  onSaveComplete,
  onSaveError,
}: AutoSaveOptions<T>): AutoSaveResult {
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  const initialDataRef = useRef<T>(data);
  const currentDataRef = useRef<T>(data);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const retryTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const saveInProgressRef = useRef(false);
  const pendingResaveRef = useRef(false);
  const prevEnabledRef = useRef(false);
  const retryAttemptRef = useRef(0);
  const performSaveRef = useRef<(dataToSave: T) => Promise<void>>(async () => {});
  const enabledRef = useRef(enabled);
  const hasUnsavedChangesRef = useRef(hasUnsavedChanges);

  const onSaveRef = useRef(onSave);
  const onSaveStartRef = useRef(onSaveStart);
  const onSaveCompleteRef = useRef(onSaveComplete);
  const onSaveErrorRef = useRef(onSaveError);

  useEffect(() => {
    onSaveRef.current = onSave;
    onSaveStartRef.current = onSaveStart;
    onSaveCompleteRef.current = onSaveComplete;
    onSaveErrorRef.current = onSaveError;
  }, [onSave, onSaveStart, onSaveComplete, onSaveError]);

  useEffect(() => {
    currentDataRef.current = data;
  }, [data]);

  useEffect(() => {
    enabledRef.current = enabled;
  }, [enabled]);

  useEffect(() => {
    hasUnsavedChangesRef.current = hasUnsavedChanges;
  }, [hasUnsavedChanges]);

  const clearRetry = () => {
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }
  };

  const performSave = useCallback(async (dataToSave: T) => {
    if (saveInProgressRef.current) {
      pendingResaveRef.current = true;
      return;
    }

    saveInProgressRef.current = true;
    setIsSaving(true);
    onSaveStartRef.current?.();

    try {
      await onSaveRef.current(dataToSave);
      retryAttemptRef.current = 0;
      clearRetry();
      setLastSaved(new Date());
      initialDataRef.current = dataToSave;
      if (JSON.stringify(currentDataRef.current) === JSON.stringify(dataToSave)) {
        setHasUnsavedChanges(false);
      }
      onSaveCompleteRef.current?.();
    } catch (err) {
      pendingResaveRef.current = false;
      onSaveErrorRef.current?.(err instanceof Error ? err : new Error('Save failed'));
      const wait = nextAutosaveRetryDelayMs(retryAttemptRef.current);
      retryAttemptRef.current += 1;
      clearRetry();
      retryTimeoutRef.current = setTimeout(() => {
        retryTimeoutRef.current = null;
        void performSaveRef.current(currentDataRef.current);
      }, wait);
    } finally {
      setIsSaving(false);
      saveInProgressRef.current = false;
      if (pendingResaveRef.current) {
        pendingResaveRef.current = false;
        const latest = currentDataRef.current;
        if (JSON.stringify(latest) !== JSON.stringify(initialDataRef.current)) {
          void performSaveRef.current(latest);
        }
      }
    }
  }, []);

  useEffect(() => {
    performSaveRef.current = performSave;
  }, [performSave]);

  useEffect(() => {
    if (!enabled) {
      prevEnabledRef.current = false;
      initialDataRef.current = data;
      clearRetry();
      return;
    }

    if (!prevEnabledRef.current) {
      prevEnabledRef.current = true;
      initialDataRef.current = data;
      retryAttemptRef.current = 0;
      clearRetry();
      setHasUnsavedChanges(false);
      return;
    }

    const hasChanges = JSON.stringify(data) !== JSON.stringify(initialDataRef.current);

    if (!hasChanges) {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      clearRetry();
      retryAttemptRef.current = 0;
      setHasUnsavedChanges(false);
      return;
    }

    setHasUnsavedChanges(true);
    retryAttemptRef.current = 0;
    clearRetry();

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => {
      performSave(data);
    }, delay);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [data, delay, enabled, performSave]);

  const saveNow = useCallback(async () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    clearRetry();
    await performSave(currentDataRef.current);
  }, [performSave]);

  const markSaved = useCallback(() => {
    setHasUnsavedChanges(false);
    setLastSaved(new Date());
    initialDataRef.current = currentDataRef.current;
    retryAttemptRef.current = 0;
    clearRetry();
  }, []);

  const reset = useCallback(() => {
    setHasUnsavedChanges(false);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    clearRetry();
    retryAttemptRef.current = 0;
    initialDataRef.current = currentDataRef.current;
  }, []);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        return '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  useEffect(() => {
    const flush = () => {
      if (!enabledRef.current || !hasUnsavedChangesRef.current) return;
      void performSaveRef.current(currentDataRef.current);
    };
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') flush();
    };
    window.addEventListener('pagehide', flush);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      window.removeEventListener('pagehide', flush);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);

  return {
    hasUnsavedChanges,
    isSaving,
    lastSaved,
    saveNow,
    markSaved,
    reset,
  };
}
