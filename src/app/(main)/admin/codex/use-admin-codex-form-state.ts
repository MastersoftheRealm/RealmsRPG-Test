'use client';

import { useCallback, useRef, useState, type Dispatch, type SetStateAction } from 'react';

/** Apply the same update `useState` would, for tests that simulate Save before re-render. */
export function resolveCodexFormDraft<T>(prev: T, action: SetStateAction<T>): T {
  return typeof action === 'function' ? (action as (value: T) => T)(prev) : action;
}

/**
 * Codex edit modals read form state on Save. Sync the draft ref when `setForm` runs so
 * Save after the last keystroke sees the edited text even before React re-renders.
 */
export function useAdminCodexFormState<T>(initial: T): {
  form: T;
  setForm: Dispatch<SetStateAction<T>>;
  getForm: () => T;
} {
  const [form, setFormState] = useState<T>(initial);
  const formRef = useRef(form);

  const setForm = useCallback((action: SetStateAction<T>) => {
    setFormState((prev) => {
      const next = resolveCodexFormDraft(prev, action);
      formRef.current = next;
      return next;
    });
  }, []);

  const getForm = useCallback(() => formRef.current, []);
  return { form, setForm, getForm };
}
