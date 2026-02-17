/**
 * Creator Tab Bar
 * ===============
 * Navigation tabs for character creation wizard
 */

'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { useCharacterCreatorStore, STEP_ORDER, type CreatorStep } from '@/stores/character-creator-store';
import { ConfirmActionModal } from '@/components/shared';

const STEP_LABELS: Record<CreatorStep, string> = {
  archetype: '1. Archetype',
  species: '2. Species',
  ancestry: '3. Ancestry',
  abilities: '4. Abilities',
  skills: '5. Skills',
  feats: '6. Feats',
  equipment: '7. Equipment',
  powers: '8. Powers',
  finalize: '9. Finalize',
};

export function CreatorTabBar() {
  const { currentStep, completedSteps, setStep, canNavigateToStep, markStepComplete, hasUnconfirmedSelection, resetCreator } = useCharacterCreatorStore();
  const [showRestartConfirm, setShowRestartConfirm] = useState(false);
  const [pendingStep, setPendingStep] = useState<CreatorStep | null>(null);

  const handleTabClick = (step: CreatorStep) => {
    if (step === currentStep) return;
    if (!canNavigateToStep(step)) return;
    if (hasUnconfirmedSelection(currentStep)) {
      setPendingStep(step);
      return;
    }
    setStep(step);
  };

  const handleConfirmUnconfirmed = () => {
    if (pendingStep !== null) {
      markStepComplete(currentStep);
      setStep(pendingStep);
      setPendingStep(null);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-1 p-2 bg-surface-alt rounded-lg mb-4">
      {STEP_ORDER.map((step) => {
        const isActive = currentStep === step;
        const isComplete = completedSteps.includes(step);
        const canNavigate = canNavigateToStep(step);

        return (
          <button
            key={step}
            onClick={() => handleTabClick(step)}
            disabled={!canNavigate}
            className={cn(
              'px-3 py-2 rounded-lg text-sm font-medium transition-all',
              isActive && 'bg-primary-600 text-white shadow-md',
              !isActive && isComplete && 'bg-green-100 text-green-700 hover:bg-green-200',
              !isActive && !isComplete && canNavigate && 'bg-surface text-text-secondary hover:bg-surface-alt',
              !isActive && !isComplete && !canNavigate && 'bg-surface text-text-muted cursor-not-allowed'
            )}
          >
            {isComplete && !isActive && '✓ '}
            {STEP_LABELS[step]}
          </button>
        );
      })}
      
      <button
        onClick={() => setShowRestartConfirm(true)}
        className="ml-auto px-3 py-2 rounded-lg text-sm font-medium bg-red-100 text-red-700 hover:bg-red-200 transition-colors"
      >
        Restart
      </button>

      <ConfirmActionModal
        isOpen={showRestartConfirm}
        onClose={() => setShowRestartConfirm(false)}
        onConfirm={() => {
          resetCreator();
          setShowRestartConfirm(false);
        }}
        title="Restart Character"
        description="Are you sure you want to restart? All progress for this character will be lost."
        confirmLabel="Restart"
        confirmVariant="danger"
      />

      <ConfirmActionModal
        isOpen={pendingStep !== null}
        onClose={() => setPendingStep(null)}
        onConfirm={handleConfirmUnconfirmed}
        title="Step not confirmed"
        description={`You've made a selection on this step but haven't clicked Continue. Mark this step complete and go to ${pendingStep !== null ? STEP_LABELS[pendingStep] : ''}?`}
        confirmLabel="Mark complete & go"
        confirmVariant="primary"
      />
    </div>
  );
}
