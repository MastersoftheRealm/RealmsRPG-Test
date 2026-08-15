/**
 * Ancestry Step
 * ==============
 * Select ancestry traits, characteristic, and optional flaw from species.
 *
 * Selection Rules:
 * - 1 ancestry trait by default
 * - Selecting a flaw grants +1 extra ancestry trait (up to 2 total)
 * - 1 characteristic (optional)
 * - Species traits are automatic (not selectable)
 */

'use client';

import { Button, Alert } from '@/components/ui';
import { InfoTippy } from '@/components/shared';
import { CreatorStepFooter } from '@/components/character-creator/creator-step-footer';
import { chooseYourAncestryTraits } from '../../../../public/tooltip-text';
import { useAncestryStepState } from './ancestry/use-ancestry-step-state';
import { AncestryMixedPanel } from './ancestry/ancestry-mixed-panel';
import { AncestrySinglePanel } from './ancestry/ancestry-single-panel';

export function AncestryStep() {
  const state = useAncestryStepState();
  const { draft, isMixed, selectedSpecies, speciesA, speciesB, prevStep, nextStep, setStep } =
    state;

  if (!draft.ancestry?.id) {
    return (
      <div className="mx-auto max-w-2xl text-center">
        <div className="mb-2 flex items-center justify-center gap-1">
          <h2 className="text-2xl font-bold text-text-primary">Choose Your Ancestry Traits</h2>
          <InfoTippy
            content={chooseYourAncestryTraits}
            allowHTML
            label="Ancestry trait rules"
            size="inline"
          />
        </div>
        <p className="mb-6 text-text-secondary">
          Customize your character with ancestry traits and an optional flaw.
        </p>
        <Alert variant="warning" className="mb-8">
          <div className="text-center">
            <p className="mb-4">
              <strong>No species selected!</strong> Please choose a species first.
            </p>
            <Button onClick={() => setStep('species')} className="min-h-11">
              Go to Species Selection
            </Button>
          </div>
        </Alert>
        <CreatorStepFooter
          onBack={prevStep}
          primaryAction={
            <Button disabled className="min-h-11 min-w-11">
              Continue →
            </Button>
          }
        />
      </div>
    );
  }

  if (isMixed && speciesA && speciesB) {
    return (
      <AncestryMixedPanel
        {...state}
        speciesA={speciesA}
        speciesB={speciesB}
        onChangeSpecies={() => setStep('species')}
        onBack={prevStep}
        onContinue={nextStep}
      />
    );
  }

  if (!selectedSpecies) {
    return (
      <div className="mx-auto max-w-2xl text-center">
        <Alert variant="warning" className="mb-8">
          Species data could not be loaded. Try changing species.
        </Alert>
        <CreatorStepFooter
          onBack={prevStep}
          continueLabel="Change Species"
          onContinue={() => setStep('species')}
        />
      </div>
    );
  }

  return (
    <AncestrySinglePanel
      {...state}
      selectedSpecies={selectedSpecies}
      onChangeSpecies={() => setStep('species')}
      onBack={prevStep}
      onContinue={nextStep}
    />
  );
}
