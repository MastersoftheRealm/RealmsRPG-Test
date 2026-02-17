/**
 * Creator Tab Bar
 * ===============
 * Navigation tabs for character creation wizard.
 * Moving to another step = treat as Continue (mark current complete and go),
 * unless the current step has missing requirements — then show what's missing
 * and offer "Continue anyway" / "Stay".
 */

'use client';

import { useMemo, useState } from 'react';
import { cn } from '@/lib/utils';
import { useCharacterCreatorStore, STEP_ORDER, type CreatorStep } from '@/stores/character-creator-store';
import { useSpecies, useCodexSkills } from '@/hooks';
import { getValidationIssuesForStep, type ValidationIssue } from '@/lib/character-creator-validation';
import { ConfirmActionModal } from '@/components/shared';
import { Modal, Button } from '@/components/ui';

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
  const { draft, currentStep, completedSteps, setStep, canNavigateToStep, markStepComplete, resetCreator } = useCharacterCreatorStore();
  const { data: allSpecies = [] } = useSpecies();
  const { data: codexSkills } = useCodexSkills();
  const [showRestartConfirm, setShowRestartConfirm] = useState(false);
  const [pendingStep, setPendingStep] = useState<CreatorStep | null>(null);

  const context = useMemo(
    () => ({ allSpecies, codexSkills: codexSkills ?? null }),
    [allSpecies, codexSkills]
  );
  const currentStepIssues = useMemo<ValidationIssue[]>(
    () => getValidationIssuesForStep(currentStep, draft, context),
    [currentStep, draft, context]
  );

  const handleTabClick = (step: CreatorStep) => {
    if (step === currentStep) return;
    if (!canNavigateToStep(step)) return;

    if (currentStepIssues.length > 0) {
      setPendingStep(step);
      return;
    }
    markStepComplete(currentStep);
    setStep(step);
  };

  const handleContinueAnyway = () => {
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

      <Modal
        isOpen={pendingStep !== null}
        onClose={() => setPendingStep(null)}
        size="lg"
        title={`${STEP_LABELS[currentStep]} — things left to do`}
        showCloseButton={true}
        contentClassName="p-4 overflow-y-auto max-h-[50vh]"
        footer={
          <div className="p-4 border-t border-border-light flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setPendingStep(null)}>
              Stay & fix
            </Button>
            <Button variant="primary" onClick={handleContinueAnyway}>
              Continue anyway
            </Button>
          </div>
        }
      >
        {pendingStep !== null && (
          <div className="space-y-3">
            <p className="text-text-secondary text-sm mb-3">
              You’re about to go to {STEP_LABELS[pendingStep]}. This step still has:
            </p>
            {currentStepIssues.map((issue, idx) => (
              <div
                key={idx}
                className={cn(
                  'p-3 rounded-lg flex gap-3',
                  issue.severity === 'error' ? 'bg-red-50 dark:bg-red-900/30' : 'bg-amber-50 dark:bg-amber-900/30'
                )}
              >
                <span className="text-xl flex-shrink-0">{issue.emoji}</span>
                <p className="text-text-secondary">{issue.message}</p>
              </div>
            ))}
          </div>
        )}
      </Modal>
    </div>
  );
}
