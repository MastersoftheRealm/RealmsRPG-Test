'use client';

import { Button } from '@/components/ui';
import { useCharacterCreatorStore, type CreatorStep } from '@/stores/character-creator-store';

export function StepEditLink({ step, label }: { step: CreatorStep; label: string }) {
  const { setStep, canNavigateToStep } = useCharacterCreatorStore();
  if (!canNavigateToStep(step)) return null;
  return (
    <Button
      type="button"
      variant="link"
      size="sm"
      onClick={() => setStep(step)}
      className="min-h-11 shrink-0"
    >
      Edit {label}
    </Button>
  );
}
