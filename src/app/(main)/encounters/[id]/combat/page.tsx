/**
 * Combat Encounter Page
 * ======================
 * Supabase-backed combat tracker for a specific encounter.
 * Ported from encounter-tracker with persistence via encounter-service.
 */

'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { LoadingState, PageContainer, Alert, useToast } from '@/components/ui';
import { useEncounter, useSaveEncounter, useAutoSave, useCampaignsFull } from '@/hooks';
import { RollProvider } from '@/components/character-sheet';
import type { Encounter } from '@/types/encounter';
import CombatEncounterView from '../_components/CombatEncounterView';
import { EncounterPageHeader } from '../_components/EncounterPageHeader';

interface PageParams {
  params: Promise<{ id: string }>;
}

export default function CombatEncounterPage({ params }: PageParams) {
  return <CombatEncounterContent params={params} />;
}

function CombatEncounterContent({ params }: { params: Promise<{ id: string }> }) {
  const { id: encounterId } = use(params);
  const { data: encounterData, isLoading, error } = useEncounter(encounterId);
  const saveMutation = useSaveEncounter();
  const [encounter, setEncounter] = useState<Encounter | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const { data: campaignsFull = [] } = useCampaignsFull();

  useEffect(() => {
    if (encounterData && !isInitialized) {
      setEncounter(encounterData);
      setNameInput(encounterData.name || '');
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
        <LoadingState message="Loading encounter..." size="lg" padding="lg" />
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
          encounterType="Combat"
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

        <CombatEncounterView
          encounterId={encounterId}
          encounter={encounter}
          setEncounter={setEncounter}
          campaignsFull={campaignsFull}
          showRollLog
        />
      </PageContainer>
    </RollProvider>
  );
}
