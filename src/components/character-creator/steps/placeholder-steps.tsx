/**
 * Placeholder Steps
 * =================
 * Placeholder components for steps not yet fully implemented
 */

'use client';

import { useCharacterCreatorStore } from '@/stores/character-creator-store';

interface PlaceholderStepProps {
  title: string;
  description: string;
}

function PlaceholderStep({ title, description }: PlaceholderStepProps) {
  const { nextStep, prevStep } = useCharacterCreatorStore();
  
  return (
    <div className="max-w-2xl mx-auto text-center">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">{title}</h1>
      <p className="text-gray-600 mb-6">{description}</p>
      
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 mb-8">
        <p className="text-amber-700">
          This step is under construction. Click Continue to proceed.
        </p>
      </div>
      
      <div className="flex justify-between">
        <button
          onClick={prevStep}
          className="px-6 py-3 rounded-xl font-medium text-gray-600 hover:bg-gray-100 transition-colors"
        >
          ← Back
        </button>
        <button
          onClick={nextStep}
          className="px-8 py-3 rounded-xl font-bold bg-primary-600 text-white hover:bg-primary-700 transition-colors"
        >
          Continue →
        </button>
      </div>
    </div>
  );
}

export function AncestryStep() {
  return (
    <PlaceholderStep
      title="Choose Your Ancestry"
      description="Select the specific lineage within your species that defines your character's heritage."
    />
  );
}

// PowersStep has been moved to powers-step.tsx
