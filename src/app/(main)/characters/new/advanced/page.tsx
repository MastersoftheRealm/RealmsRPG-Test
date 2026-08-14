/**
 * Legacy Character Creator Page
 * =============================
 * Classic 9-step tabbed wizard (route `/characters/new/advanced`). User-facing
 * label is Legacy — the cohesive Guided creator (L1–L3) will replace it.
 * Guest access with localStorage; login required only for saving.
 */

'use client';

import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { useAuth } from '@/hooks';
import { LoadingState, PageContainer, PageHeader, Card, DescriptorChip } from '@/components/ui';
import { useCharacterCreatorStore, STEP_ORDER, isCreatorStepSkipped } from '@/stores/character-creator-store';
import { InfoTippy } from '@/components/shared';
import { GUIDED_CREATOR_COPY } from '@/lib/constants/site-copy';
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

const wizardCopy = GUIDED_CREATOR_COPY.legacyWizard;
const changeModeLink = GUIDED_CREATOR_COPY.shell.changeModeLink;

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

export default function LegacyCharacterCreatorPage() {
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
        <Link
          href="/characters/new"
          className="inline-flex items-center gap-1.5 min-h-11 mb-3 -mt-1 font-nunito text-sm font-medium text-primary-link-fg hover:text-primary-fg-hover transition-colors"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          {changeModeLink}
        </Link>

        <PageHeader
          title={
            <>
              {wizardCopy.title}
              <DescriptorChip variant="default" size="sm" className="font-semibold shrink-0">
                {wizardCopy.badge}
              </DescriptorChip>
            </>
          }
          description={wizardCopy.description(stepIndex, totalSteps)}
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
