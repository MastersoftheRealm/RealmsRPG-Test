/**
 * Character Creator Page
 * ======================
 * Multi-step character creation wizard
 * Allows guest access with localStorage persistence
 * Login is required only for saving
 */

'use client';

import { useAuth } from '@/hooks';
import { LoadingState, PageContainer } from '@/components/ui';
import { useCharacterCreatorStore } from '@/stores/character-creator-store';
import {
  CreatorTabBar,
  ArchetypeStep,
  SpeciesStep,
  AncestryStep,
  AbilitiesStep,
  SkillsStep,
  FeatsStep,
  EquipmentStep,
  PowersStep,
  FinalizeStep,
} from '@/components/character-creator';
import { STEP_ORDER } from '@/stores/character-creator-store';

const STEP_COMPONENTS = {
  archetype: ArchetypeStep,
  species: SpeciesStep,
  ancestry: AncestryStep,
  abilities: AbilitiesStep,
  skills: SkillsStep,
  feats: FeatsStep,
  equipment: EquipmentStep,
  powers: PowersStep,
  finalize: FinalizeStep,
};

export default function CharacterCreatorPage() {
  const { loading } = useAuth();
  const { currentStep } = useCharacterCreatorStore();
  const stepIndex = STEP_ORDER.indexOf(currentStep) + 1;
  const totalSteps = STEP_ORDER.length;
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingState message="Loading..." size="lg" />
      </div>
    );
  }
  
  const StepComponent = STEP_COMPONENTS[currentStep];
  
  return (
    <div className="min-h-screen bg-background py-6">
      <PageContainer size="xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-text-primary">Create New Character</h1>
          <p className="text-text-secondary mt-1">
            Step {stepIndex} of {totalSteps} — Follow the steps below to build your character
          </p>
          <p className="text-text-secondary text-sm mt-3 rounded-lg bg-muted/50 dark:bg-muted/30 px-3 py-2 border border-border-light">
            <strong className="text-text-primary">Tip:</strong> Start with <strong className="text-text-primary">Choose a Path</strong> for guided recommendations, or use <strong className="text-text-primary">Forge Your Own Path</strong> for full customization.
          </p>
        </div>
        
        <CreatorTabBar />
        
        <div className="bg-surface rounded-xl shadow-md p-6 md:p-8">
          <StepComponent />
        </div>
      </PageContainer>
    </div>
  );
}
