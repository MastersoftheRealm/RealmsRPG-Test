'use client';

import { Button } from '@/components/ui';
import { useGuidedCreatorStore, type GuidedSubStep } from '@/stores/guided-creator-store';

export interface GuidedStepEditLinkProps {
  subStep: GuidedSubStep;
  label: string;
}

export function GuidedStepEditLink({ subStep, label }: GuidedStepEditLinkProps) {
  const { setSubStep, canNavigateToSubStep } = useGuidedCreatorStore();

  if (!canNavigateToSubStep(subStep)) return null;

  return (
    <Button
      type="button"
      variant="link"
      size="sm"
      onClick={() => setSubStep(subStep)}
      className="min-h-11 shrink-0"
    >
      Edit {label}
    </Button>
  );
}
