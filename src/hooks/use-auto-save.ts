/**
 * useAutoSave Hook
 * ================
 * Provides debounced auto-save functionality for forms.
 * Tracks changes and saves after a delay to reduce server calls.
 */

import { useState, useEffect, useCallback, useRef } from 'react';

interface AutoSaveOptions<T> {
  /** Data to watch for changes */
  data: T;
  /** Function to call when saving */
  onSave: (data: T) => Promise<void>;
  /** Debounce delay in milliseconds (default: 2000) */
  delay?: number;
  /** Whether auto-save is enabled (default: true) */
  enabled?: boolean;
  /** Callback when save starts */
  onSaveStart?: () => void;
  /** Callback when save completes */
  onSaveComplete?: () => void;
  /** Callback when save fails */
  onSaveError?: (error: Error) => void;
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
  
  // Track initial data to compare changes
  const initialDataRef = useRef<T>(data);
  const currentDataRef = useRef<T>(data);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const saveInProgressRef = useRef(false);
  // True when an edit arrives while a save is in flight — triggers a follow-up
  // save so concurrent edits are never dropped.
  const pendingResaveRef = useRef(false);
  // Tracks the enabled→true transition so loading/enabling doesn't look like an edit.
  const prevEnabledRef = useRef(false);
  // Latest performSave, used to schedule the follow-up save without a self-reference.
  const performSaveRef = useRef<(dataToSave: T) => Promise<void>>(async () => {});

  // Update current data ref
  useEffect(() => {
    currentDataRef.current = data;
  }, [data]);

  // Perform the actual save
  const performSave = useCallback(async (dataToSave: T) => {
    // A save is already running: remember to re-save the latest snapshot after.
    if (saveInProgressRef.current) {
      pendingResaveRef.current = true;
      return;
    }

    saveInProgressRef.current = true;
    setIsSaving(true);
    onSaveStart?.();

    try {
      await onSave(dataToSave);
      setLastSaved(new Date());
      initialDataRef.current = dataToSave;
      // Only clear the dirty flag if no newer edits arrived during the save.
      if (JSON.stringify(currentDataRef.current) === JSON.stringify(dataToSave)) {
        setHasUnsavedChanges(false);
      }
      onSaveComplete?.();
    } catch (err) {
      onSaveError?.(err instanceof Error ? err : new Error('Save failed'));
    } finally {
      setIsSaving(false);
      saveInProgressRef.current = false;
      // Edits arrived mid-save (or the same save coalesced more changes): persist
      // the most recent snapshot so nothing is lost.
      if (pendingResaveRef.current) {
        pendingResaveRef.current = false;
        const latest = currentDataRef.current;
        if (JSON.stringify(latest) !== JSON.stringify(initialDataRef.current)) {
          void performSaveRef.current(latest);
        }
      }
    }
  }, [onSave, onSaveStart, onSaveComplete, onSaveError]);

  useEffect(() => {
    performSaveRef.current = performSave;
  }, [performSave]);

  // Debounced save effect
  useEffect(() => {
    // While disabled, keep the baseline in sync so re-enabling never sees a
    // phantom diff (and never triggers a save just for loading data).
    if (!enabled) {
      prevEnabledRef.current = false;
      initialDataRef.current = data;
      return;
    }

    // Autosave just turned on (e.g. data finished loading / ownership resolved):
    // adopt the current data as the saved baseline and do NOT fire a save.
    if (!prevEnabledRef.current) {
      prevEnabledRef.current = true;
      initialDataRef.current = data;
      setHasUnsavedChanges(false);
      return;
    }

    // Compare current data with the last-saved baseline
    const hasChanges = JSON.stringify(data) !== JSON.stringify(initialDataRef.current);

    if (!hasChanges) {
      // Data returned to the saved baseline — cancel any pending save.
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      setHasUnsavedChanges(false);
      return;
    }

    setHasUnsavedChanges(true);

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

  // Save immediately
  const saveNow = useCallback(async () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    await performSave(currentDataRef.current);
  }, [performSave]);

  // Mark as saved without calling onSave
  const markSaved = useCallback(() => {
    setHasUnsavedChanges(false);
    setLastSaved(new Date());
    initialDataRef.current = currentDataRef.current;
  }, []);

  // Reset dirty state
  const reset = useCallback(() => {
    setHasUnsavedChanges(false);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    initialDataRef.current = currentDataRef.current;
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // Save on page unload if there are unsaved changes
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

  return {
    hasUnsavedChanges,
    isSaving,
    lastSaved,
    saveNow,
    markSaved,
    reset,
  };
}
