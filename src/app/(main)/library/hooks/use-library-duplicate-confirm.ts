'use client';

import { useCallback, useState } from 'react';
import { useToast } from '@/components/ui';
import { getErrorMessage } from '@/lib/api-client';

export interface UseLibraryDuplicateConfirmOptions {
  duplicateTitle: string;
  isPending: boolean;
  mutate: (
    id: string,
    handlers: { onSuccess: () => void; onError: (e: Error) => void }
  ) => void;
}

export function useLibraryDuplicateConfirm(options: UseLibraryDuplicateConfirmOptions) {
  const { duplicateTitle, isPending, mutate } = options;
  const { showToast } = useToast();
  const [duplicateConfirm, setDuplicateConfirm] = useState<{ id: string; name: string } | null>(
    null
  );

  const openDuplicateConfirm = useCallback((id: string, name: string) => {
    setDuplicateConfirm({ id, name });
  }, []);

  const onConfirmDuplicate = useCallback(() => {
    if (!duplicateConfirm) return;
    mutate(duplicateConfirm.id, {
      onSuccess: () => {
        showToast(`Duplicated "${duplicateConfirm.name}"`, 'success');
        setDuplicateConfirm(null);
      },
      onError: (e) => showToast(getErrorMessage(e, 'Failed to duplicate'), 'error'),
    });
  }, [duplicateConfirm, mutate, showToast]);

  return {
    duplicateConfirm,
    openDuplicateConfirm,
    closeDuplicateConfirm: () => setDuplicateConfirm(null),
    onConfirmDuplicate,
    duplicateTitle,
    isPending,
  };
}
