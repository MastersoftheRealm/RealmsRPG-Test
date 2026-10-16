'use client';

import { useState } from 'react';
import { ConfirmActionModal } from '@/components/patterns';
import { Button } from '@/components/ui';
import { ONBOARDING_COPY } from '@/lib/constants/copy/onboarding-copy';

type AllocationResetKind = 'abilities' | 'skills';

interface SheetAllocationResetButtonProps {
  kind: AllocationResetKind;
  disabled?: boolean | undefined;
  onConfirm: () => void;
}

export function SheetAllocationResetButton({
  kind,
  disabled = false,
  onConfirm,
}: SheetAllocationResetButtonProps) {
  const copy = ONBOARDING_COPY.allocationReset[kind];
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        type="button"
        variant="secondary"
        size="sm"
        disabled={disabled}
        onClick={() => setOpen(true)}
        className="shrink-0"
      >
        {copy.button}
      </Button>
      <ConfirmActionModal
        isOpen={open}
        onClose={() => setOpen(false)}
        onConfirm={() => {
          onConfirm();
          setOpen(false);
        }}
        title={copy.confirmTitle}
        description={copy.confirmDescription}
        confirmLabel={copy.confirmLabel}
      />
    </>
  );
}
