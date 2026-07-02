/**
 * Mixed Encounter Page
 * =====================
 * Combines combat and skill encounter functionality in a tab-based view.
 * Reuses CombatEncounterView and SkillEncounterView; both states on the same Encounter document.
 */

'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Swords, Brain } from 'lucide-react';
import { PageContainer, LoadingState, Alert, useToast } from '@/components/ui';
import { SegmentedControl } from '@/components/shared';
import { useEncounter, useSaveEncounter, useAutoSave, useCampaignsFull } from '@/hooks';
import { RollProvider, RollLog } from '@/components/character-sheet';
import type { Encounter } from '@/types/encounter';
import CombatEncounterView from '../_components/CombatEncounterView';
import SkillEncounterView from '../_components/SkillEncounterView';
import { EncounterPageHeader } from '../_components/EncounterPageHeader';
type ViewTab = 'combat' | 'skill';

interface PageParams {
  params: Promise<{ id: string }>;
}

export default function MixedEncounterPage({ params }: PageParams) {
  return <MixedEncounterContent params={params} />;
}

function MixedEncounterContent({ params }: { params: Promise<{ id: string }> }) {
  const { id: encounterId } = use(params);
  const { data: encounterData, isLoading, error } = useEncounter(encounterId);
  const saveMutation = useSaveEncounter();
  const [encounter, setEncounter] = useState<Encounter | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [activeView, setActiveView] = useState<ViewTab>('combat');
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const { data: campaignsFull = [] } = useCampaignsFull();

  useEffect(() => {
    if (encounterData && !isInitialized) {
      const enc = { ...encounterData };
      if (!enc.skillEncounter) {
        enc.skillEncounter = {
          difficultyScore: 10,
          participants: [],
          currentSuccesses: 0,
          currentFailures: 0,
          additionalSuccesses: 0,
          additionalFailures: 0,
          requiredSuccesses: 1,
          maxFailures: 3,
          useInitiative: true, // mixed encounter: default to initiative so turn order can sync with combat
        };
      } else {
        const sk = enc.skillEncounter as unknown as Record<string, unknown>;
        const participants = (sk.participants as unknown[]) ?? [];
        if (sk.additionalSuccesses == null) sk.additionalSuccesses = 0;
        if (sk.additionalFailures == null) sk.additionalFailures = 0;
        if (sk.requiredSuccesses == null) sk.requiredSuccesses = Math.max(1, participants.length + 1);
        if (sk.maxFailures == null) sk.maxFailures = 3;
        // Mixed encounter: default useInitiative to true so skill tab can sync with combat order
        if (sk.useInitiative == null) sk.useInitiative = true;
      }
      setEncounter(enc);
      setNameInput(enc.name || '');
      setIsInitialized(true);
    }
  }, [encounterData, isInitialized]);

  useEffect(() => {
    if (encounter?.name && !isEditingName) setNameInput(encounter.name);
  }, [encounter?.name, isEditingName]);

  const { showToast } = useToast();
  const { isSaving, hasUnsavedChanges } = useAutoSave({
    data: encounter,
    onSave: async (data) => {
      if (!data || !encounterId) return;
      const { id: _id, createdAt: _ca, ...rest } = data;
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
          onStartEditingName={() => setIsEditingName(true)}
          onCommitName={handleCommitName}
          onCancelEdit={handleCancelEditName}
          isSaving={isSaving}
          hasUnsavedChanges={hasUnsavedChanges}
        />

        <SegmentedControl
          value={activeView}
          onChange={setActiveView}
          equalWidth
          options={[
            { value: 'combat', label: 'Combat', icon: <Swords className="w-4 h-4" aria-hidden /> },
            { value: 'skill', label: 'Skill', icon: <Brain className="w-4 h-4" aria-hidden /> },
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
