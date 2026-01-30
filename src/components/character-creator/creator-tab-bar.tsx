/**
 * Creator Tab Bar
 * ===============
 * Navigation tabs for character creation wizard
 */

'use client';

import { cn } from '@/lib/utils';
import { useCharacterCreatorStore, STEP_ORDER, type CreatorStep } from '@/stores/character-creator-store';

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
  const { currentStep, completedSteps, setStep, canNavigateToStep, resetCreator } = useCharacterCreatorStore();

  return (
    <div className="flex flex-wrap items-center gap-1 p-2 bg-neutral-100 rounded-lg mb-4">
      {STEP_ORDER.map((step) => {
        const isActive = currentStep === step;
        const isComplete = completedSteps.includes(step);
        const canNavigate = canNavigateToStep(step);

        return (
          <button
            key={step}
            onClick={() => setStep(step)}
            disabled={!canNavigate}
            className={cn(
              'px-3 py-2 rounded-lg text-sm font-medium transition-all',
              isActive && 'bg-primary-600 text-white shadow-md',
              !isActive && isComplete && 'bg-green-100 text-green-700 hover:bg-green-200',
              !isActive && !isComplete && canNavigate && 'bg-white text-text-secondary hover:bg-neutral-50',
              !isActive && !isComplete && !canNavigate && 'bg-neutral-200 text-text-muted cursor-not-allowed'
            )}
          >
            {isComplete && !isActive && '✓ '}
            {STEP_LABELS[step]}
          </button>
        );
      })}
      
      <button
        onClick={() => {
          if (confirm('Are you sure you want to restart? All progress will be lost.')) {
            resetCreator();
          }
        }}
        className="ml-auto px-3 py-2 rounded-lg text-sm font-medium bg-red-100 text-red-700 hover:bg-red-200 transition-colors"
      >
        Restart
      </button>
    </div>
  );
}
