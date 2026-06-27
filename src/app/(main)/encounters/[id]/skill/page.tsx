/**
 * Skill Encounter Page
 * =====================
 * Skill encounter tracker: DS, participants, roll tracking, success/failure.
 * Per GAME_RULES: roll >= DS = 1 + floor((roll-DS)/5) successes; roll < DS = 1 + floor((DS-roll)/5) failures.
 */

'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { PageContainer, LoadingState, Alert, useToast } from '@/components/ui';
import { useEncounter, useSaveEncounter, useAutoSave, useCampaignsFull } from '@/hooks';
import { RollProvider } from '@/components/character-sheet';
import type { Encounter, SkillParticipant } from '@/types/encounter';
import { computeSkillRollResult } from '@/lib/game/encounter-utils';
import SkillEncounterView from '../_components/SkillEncounterView';
import { EncounterPageHeader } from '../_components/EncounterPageHeader';

interface PageParams {
  params: Promise<{ id: string }>;
}

export default function SkillEncounterPage({ params }: PageParams) {
  return <SkillEncounterContent params={params} />;
}

function SkillEncounterContent({ params }: { params: Promise<{ id: string }> }) {
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
        };
      } else {
        const sk = enc.skillEncounter as unknown as Record<string, unknown>;
        const participants = (sk.participants as SkillParticipant[]) || [];
        const ds = (sk.difficultyScore as number) ?? 10;
        sk.participants = participants.map((p) => {
          if (
            p.hasRolled &&
            p.rollValue != null &&
            (p.successCount == null && p.failureCount == null)
          ) {
            const { successes, failures } = computeSkillRollResult(
              p.rollValue + (p.rmBonus ?? 0),
              ds
            );
            return { ...p, successCount: successes, failureCount: failures };
          }
          return p;
        });
        if (sk.additionalSuccesses == null) sk.additionalSuccesses = 0;
        if (sk.additionalFailures == null) sk.additionalFailures = 0;
        if (sk.requiredSuccesses == null) sk.requiredSuccesses = Math.max(1, participants.length + 1);
        if (sk.maxFailures == null) sk.maxFailures = 3;
      }
      setNameInput(enc.name || '');
      setEncounter(enc);
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

  if (!encounter || !encounter.skillEncounter) {
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
          encounterType="Skill"
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

        <SkillEncounterView
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
