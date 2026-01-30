/**
 * Character Creator Page
 * ======================
 * Multi-step character creation wizard
 * Allows guest access with localStorage persistence
 * Login is required only for saving
 */

'use client';

import { useAuth } from '@/hooks';
import { LoadingState } from '@/components/ui/spinner';
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
      <div className="max-w-6xl mx-auto px-4">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-text-primary">Create New Character</h1>
          <p className="text-text-secondary mt-1">
            Follow the steps below to build your character
          </p>
        </div>
        
        <CreatorTabBar />
        
        <div className="bg-surface rounded-xl shadow-md p-6 md:p-8">
          <StepComponent />
        </div>
      </div>
    </div>
  );
}
