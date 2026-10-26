'use client';

import {
  useCallback,
  useLayoutEffect,
  useRef,
  useState,
  type Dispatch,
  type SetStateAction,
} from 'react';

/**
 * Codex edit modals read form state on Save. A plain `useState` closure can lag one
 * commit behind the controlled field the admin just edited; keep a ref in sync.
 */
export function useAdminCodexFormState<T>(initial: T): {
  form: T;
  setForm: Dispatch<SetStateAction<T>>;
  getForm: () => T;
} {
  const [form, setForm] = useState<T>(initial);
  const formRef = useRef(form);
  useLayoutEffect(() => {
    formRef.current = form;
  }, [form]);
  const getForm = useCallback(() => formRef.current, []);
  return { form, setForm, getForm };
}
