/**
 * Advanced (Classic) Character Creator Page
 * =========================================
 * The full multi-step character creation wizard (9 steps).
 * Allows guest access with localStorage persistence; login required only for saving.
 *
 * This is the original creator, moved from /characters/new so that /characters/new
 * can host the Simple-vs-Advanced entry chooser (REALMS_PRODUCT_OVERVIEW.md §5.0).
 */

'use client';

import { useAuth } from '@/hooks';
import { LoadingState, PageContainer, PageHeader, Card } from '@/components/ui';
import { useCharacterCreatorStore, STEP_ORDER, isCreatorStepSkipped } from '@/stores/character-creator-store';
import { InfoTippy } from '@/components/shared';
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
import { createNewCharacter } from '../../../../../../public/tooltip-text';

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

export default function AdvancedCharacterCreatorPage() {
  const { loading } = useAuth();
  const { currentStep, draft } = useCharacterCreatorStore();
  const visibleSteps = STEP_ORDER.filter((step) => !isCreatorStepSkipped(step, draft));
  const stepIndex = visibleSteps.indexOf(currentStep) + 1;
  const totalSteps = visibleSteps.length;

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
            <InfoTippy content={createNewCharacter} label="Character creation overview" />
          }
        />

        <CreatorTabBar />

        <Card className="shadow-md p-6 md:p-8 flex flex-col min-h-[calc(100dvh-14rem)] pb-24">
          <StepComponent />
        </Card>
      </PageContainer>
    </div>
  );
}
