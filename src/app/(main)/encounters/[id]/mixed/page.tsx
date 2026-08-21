/**
 * Mixed Encounter Page
 * =====================
 * Combines combat and skill encounter functionality in a tab-based view.
 * Reuses CombatEncounterView and SkillEncounterView; both states on the same Encounter document.
 */

'use client';

import { useState, use } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Swords, Brain } from 'lucide-react';
import { PageContainer, LoadingState, Alert, useToast } from '@/components/ui';
import { SegmentedControl } from '@/components/patterns';
import { useEncounter, useSaveEncounter, useAutoSave, useCampaignsFull } from '@/hooks';
import { RollProvider, RollLog } from '@/components/rolls';
import type { Encounter } from '@/types/encounter';
import { defaultSkillEncounterState } from '@/types/encounter';
import CombatEncounterView from '../_components/CombatEncounterView';
import SkillEncounterView from '../_components/SkillEncounterView';
import { EncounterPageHeader } from '../_components/EncounterPageHeader';
import { OpenTabletopButton } from '../_components/OpenTabletopButton';
type ViewTab = 'combat' | 'skill';

interface PageParams {
  params: Promise<{ id: string }>;
}

function prepareMixedEncounter(encounter: Encounter): Encounter {
  if (!encounter.skillEncounter) {
    // Mixed encounter: default to initiative so turn order can sync with combat.
    return {
      ...encounter,
      skillEncounter: { ...defaultSkillEncounterState(), useInitiative: true },
    };
  }

  const skill = encounter.skillEncounter;
  const participants = skill.participants ?? [];
  return {
    ...encounter,
    skillEncounter: {
      ...skill,
      participants,
      additionalSuccesses: skill.additionalSuccesses ?? 0,
      additionalFailures: skill.additionalFailures ?? 0,
      requiredSuccesses: skill.requiredSuccesses ?? Math.max(1, participants.length + 1),
      maxFailures: skill.maxFailures ?? 3,
      useInitiative: skill.useInitiative ?? true,
    },
  };
}

export default function MixedEncounterPage({ params }: PageParams) {
  return <MixedEncounterContent params={params} />;
}

function MixedEncounterContent({ params }: { params: Promise<{ id: string }> }) {
  const { id: encounterId } = use(params);
  const { data: encounterData, isLoading, error } = useEncounter(encounterId);
  const saveMutation = useSaveEncounter();
  const [encounter, setEncounter] = useState<Encounter | null>(null);
  const [initializedEncounterId, setInitializedEncounterId] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<ViewTab>('combat');
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const { data: campaignsFull = [] } = useCampaignsFull();

  if (encounterData && initializedEncounterId !== encounterId) {
    setEncounter(prepareMixedEncounter(encounterData));
    setInitializedEncounterId(encounterId);
  }
  const isInitialized = initializedEncounterId === encounterId;

  const { showToast } = useToast();
  const { isSaving, hasUnsavedChanges, saveNow } = useAutoSave({
    data: encounter,
    onSave: async (data) => {
      if (!data || !encounterId) return;
      const { id, createdAt, ...rest } = data;
      void id;
      void createdAt;
      await saveMutation.mutateAsync({ id: encounterId, data: rest });
    },
    delay: 1500,
    enabled: isInitialized && !!encounter,
    onSaveError: () => {
      showToast('Failed to save encounter. Your latest changes may not be stored.', 'error');
    },
  });

  if (isLoading) {
    return (
      <PageContainer size="full">
        <LoadingState message="Loading encounter..." size="lg" />
      </PageContainer>
    );
  }

  if (error || (!isLoading && !encounterData)) {
    return (
      <PageContainer size="full">
        <Alert variant="danger" title="Encounter not found">
          This encounter may have been deleted or you may not have access.
        </Alert>
        <Link href="/encounters" className="mt-4 inline-block text-primary-link-fg hover:underline">
          Back to Encounters
        </Link>
      </PageContainer>
    );
  }

  if (!encounter) {
    return (
      <PageContainer size="full">
        <LoadingState message="Initializing..." />
      </PageContainer>
    );
  }

  const handleCommitName = () => {
    const trimmed = nameInput.trim();
    if (trimmed && trimmed !== encounter.name) {
      setEncounter((prev) => (prev ? { ...prev, name: trimmed } : prev));
    } else {
      setNameInput(encounter.name || '');
    }
    setIsEditingName(false);
  };

  const handleCancelEditName = () => {
    setNameInput(encounter.name || '');
    setIsEditingName(false);
  };

  return (
    <RollProvider>
      <PageContainer size="full">
        <EncounterPageHeader
          encounterType="Mixed"
          name={encounter.name}
          description={encounter.description}
          isEditingName={isEditingName}
          nameInput={nameInput}
          onNameInputChange={setNameInput}
          onStartEditingName={() => {
            setNameInput(encounter.name || '');
            setIsEditingName(true);
          }}
          onCommitName={handleCommitName}
          onCancelEdit={handleCancelEditName}
          isSaving={isSaving}
          hasUnsavedChanges={hasUnsavedChanges}
          actions={
            <OpenTabletopButton
              encounterId={encounterId}
              campaignId={encounter.campaignId}
              onBeforeOpen={saveNow}
            />
          }
        />

        <SegmentedControl
          value={activeView}
          onChange={setActiveView}
          equalWidth
          options={[
            {
              value: 'combat',
              label: 'Combat',
              icon: <Swords className="h-4 w-4" aria-hidden />,
            },
            {
              value: 'skill',
              label: 'Skill',
              icon: <Brain className="h-4 w-4" aria-hidden />,
            },
          ]}
          aria-label="Mixed encounter view"
          className="mb-6 max-w-xs"
        />

        <div className={cn(activeView !== 'combat' && 'hidden')}>
          <CombatEncounterView
            encounterId={encounterId}
            encounter={encounter}
            setEncounter={setEncounter}
            campaignsFull={campaignsFull}
            showRollLog={false}
          />
        </div>
        <div className={cn(activeView !== 'skill' && 'hidden')}>
          <SkillEncounterView
            encounterId={encounterId}
            encounter={encounter}
            setEncounter={setEncounter}
            campaignsFull={campaignsFull}
            showRollLog={false}
            isMixedEncounter
          />
        </div>

        <RollLog viewOnlyCampaignId={encounter.campaignId} />
      </PageContainer>
    </RollProvider>
  );
}
