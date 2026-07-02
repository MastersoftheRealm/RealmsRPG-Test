/**
 * Character Creator Page
 * ======================
 * Multi-step character creation wizard
 * Allows guest access with localStorage persistence
 * Login is required only for saving
 */

'use client';

import { useAuth } from '@/hooks';
import { LoadingState, PageContainer, PageHeader, Card } from '@/components/ui';
import { ContextHelpTooltip } from '@/components/shared';
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
        <PageHeader
          title="Create New Character"
          description={`Step ${stepIndex} of ${totalSteps}. Follow the steps below to build your character.`}
          className="mb-6"
          actions={
            <ContextHelpTooltip
              tooltipKey="characters.new.overview"
              scope="page:/characters/new"
              label="Character creation help"
            />
          }
        />
        
        <CreatorTabBar />
        
        <Card className="shadow-md p-6 md:p-8">
          <StepComponent />
        </Card>
      </PageContainer>
    </div>
  );
}
