/**
 * Creator Tab Bar
 * ===============
 * Navigation tabs for character creation wizard.
 * Moving forward to another step = treat as Continue (mark current complete and go),
 * unless the current step has missing requirements — then show what's missing
 * and offer "Continue anyway" / "Stay". Going back to a previous step never shows that warning.
 */

'use client';

import { useMemo, useState } from 'react';
import { cn } from '@/lib/utils';
import { statusPanel } from '@/lib/ui/status-surface-classes';
import { useCharacterCreatorStore, STEP_ORDER, isCreatorStepSkipped, type CreatorStep } from '@/stores/character-creator-store';
import { useMergedSpecies, useCodexSkills, useTraits } from '@/hooks';
import { getValidationIssuesForStep, getStepCompletion, type ValidationIssue } from '@/lib/character-creator-validation';
import { ConfirmActionModal } from '@/components/shared';
import { Modal, Button } from '@/components/ui';

const STEP_NAMES: Record<CreatorStep, string> = {
  archetype: 'Archetype',
  species: 'Species',
  ancestry: 'Ancestry',
  abilities: 'Abilities',
  skills: 'Skills',
  feats: 'Feats',
  equipment: 'Equipment',
  powers: 'Powers & Techniques',
  finalize: 'Finalize',
};

export function CreatorTabBar() {
  const { draft, currentStep, completedSteps, setStep, canNavigateToStep, markStepComplete, resetCreator } = useCharacterCreatorStore();
  const { data: allSpecies = [] } = useMergedSpecies();
  const { data: codexSkills } = useCodexSkills();
  const { data: allTraits } = useTraits();
  const [showRestartConfirm, setShowRestartConfirm] = useState(false);
  const [pendingStep, setPendingStep] = useState<CreatorStep | null>(null);

  const context = useMemo(
    () => ({ allSpecies, codexSkills: codexSkills ?? null, allTraits: allTraits ?? null }),
    [allSpecies, codexSkills, allTraits]
  );
  const currentStepIssues = useMemo<ValidationIssue[]>(
    () => getValidationIssuesForStep(currentStep, draft, context),
    [currentStep, draft, context]
  );

  // Per-step completion descriptors drive the tab check-marks / counts so the
  // indicator reflects "what's done" rather than only "what's been visited".
  const visibleSteps = useMemo(
    () => STEP_ORDER.filter((step) => !isCreatorStepSkipped(step, draft)),
    [draft]
  );

  const completionByStep = useMemo(
    () =>
      STEP_ORDER.reduce((acc, step) => {
        acc[step] = getStepCompletion(step, draft, context);
        return acc;
      }, {} as Record<CreatorStep, ReturnType<typeof getStepCompletion>>),
    [draft, context]
  );

  const currentStepLabel = useMemo(() => {
    const idx = visibleSteps.indexOf(currentStep);
    return idx >= 0 ? `${idx + 1}. ${STEP_NAMES[currentStep]}` : STEP_NAMES[currentStep];
  }, [visibleSteps, currentStep]);

  const pendingStepLabel = useMemo(() => {
    if (pendingStep === null) return '';
    const idx = visibleSteps.indexOf(pendingStep);
    return idx >= 0 ? `${idx + 1}. ${STEP_NAMES[pendingStep]}` : STEP_NAMES[pendingStep];
  }, [visibleSteps, pendingStep]);

  const handleTabClick = (step: CreatorStep) => {
    if (step === currentStep) return;
    if (!canNavigateToStep(step)) return;

    const currentIndex = STEP_ORDER.indexOf(currentStep);
    const targetIndex = STEP_ORDER.indexOf(step);
    const isGoingBack = targetIndex < currentIndex;

    // Only warn when advancing to a later step with unfinished requirements.
    // Going back to edit a previous step should not block navigation.
    if (currentStepIssues.length > 0 && !isGoingBack) {
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
    <div className="flex flex-nowrap md:flex-wrap items-center gap-1 p-2 bg-surface-alt rounded-lg mb-4 overflow-x-auto scrollbar-thin min-w-0" style={{ WebkitOverflowScrolling: 'touch' }}>
      {visibleSteps.map((step, stepIndex) => {
        const stepLabel = `${stepIndex + 1}. ${STEP_NAMES[step]}`;
        const isActive = currentStep === step;
        const completion = completionByStep[step];
        // A step reads as "complete" once visited AND its requirements are met.
        const isComplete = completedSteps.includes(step) && completion.done;
        const canNavigate = canNavigateToStep(step);

        return (
          <button
            key={step}
            type="button"
            onClick={() => handleTabClick(step)}
            disabled={!canNavigate}
            aria-current={isActive ? 'step' : undefined}
            className={cn(
              'px-3 py-2 min-h-11 min-w-11 rounded-lg text-sm font-medium transition-all shrink-0',
              isActive && 'bg-primary-button text-white shadow-md',
              !isActive && isComplete && 'bg-success-light text-success-fg hover:bg-success-200/80 dark:bg-success-900/30 dark:hover:bg-success-800/40',
              !isActive && !isComplete && canNavigate && 'bg-surface text-text-secondary hover:bg-surface-alt',
              !isActive && !isComplete && !canNavigate && 'bg-surface text-text-muted dark:text-text-secondary cursor-not-allowed'
            )}
          >
            {isComplete && !isActive && '✓ '}
            {stepLabel}
            {isActive && completion.required > 0 && !completion.done && (
              <span className="ml-1.5 text-xs font-semibold opacity-90">
                ({completion.made}/{completion.required})
              </span>
            )}
          </button>
        );
      })}
      
      <button
        type="button"
        onClick={() => setShowRestartConfirm(true)}
        className="ml-auto shrink-0 px-3 py-2 min-h-11 min-w-11 rounded-lg text-sm font-medium bg-danger-light text-danger-fg hover:bg-danger-200/80 dark:bg-danger-900/30 dark:hover:bg-danger-800/40 transition-colors"
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
        fullScreenOnMobile
        flexLayout
        title={`${currentStepLabel}: things left to do`}
        showCloseButton={true}
        contentClassName="p-4 overflow-y-auto"
        footer={
          <div className="shrink-0 border-t border-border-light p-4 flex justify-end gap-3">
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
              You’re about to go to {pendingStepLabel}. This step still has:
            </p>
            {currentStepIssues.map((issue, idx) => (
              <div
                key={idx}
                className={cn(
                  'p-3 rounded-lg flex gap-3',
                  issue.severity === 'error' ? statusPanel.dangerBg : statusPanel.warningBg
                )}
              >
                <span className="text-xl shrink-0">{issue.emoji}</span>
                <p className="text-text-secondary">{issue.message}</p>
              </div>
            ))}
          </div>
        )}
      </Modal>
    </div>
  );
}
