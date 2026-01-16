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

  // Update current data ref
  useEffect(() => {
    currentDataRef.current = data;
  }, [data]);

  // Perform the actual save
  const performSave = useCallback(async (dataToSave: T) => {
    if (saveInProgressRef.current) return;
    
    saveInProgressRef.current = true;
    setIsSaving(true);
    onSaveStart?.();

    try {
      await onSave(dataToSave);
      setHasUnsavedChanges(false);
      setLastSaved(new Date());
      initialDataRef.current = dataToSave;
      onSaveComplete?.();
    } catch (err) {
      onSaveError?.(err instanceof Error ? err : new Error('Save failed'));
    } finally {
      setIsSaving(false);
      saveInProgressRef.current = false;
    }
  }, [onSave, onSaveStart, onSaveComplete, onSaveError]);

  // Debounced save effect
  useEffect(() => {
    if (!enabled) return;

    // Compare current data with initial data
    const hasChanges = JSON.stringify(data) !== JSON.stringify(initialDataRef.current);
    
    if (hasChanges) {
      setHasUnsavedChanges(true);
      
      // Clear existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      // Set new timeout for auto-save
      timeoutRef.current = setTimeout(() => {
        performSave(data);
      }, delay);
    }

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
