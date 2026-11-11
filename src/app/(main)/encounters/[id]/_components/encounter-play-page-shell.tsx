'use client';

import Link from 'next/link';
import { useCallback, useState } from 'react';
import type { UseMutationResult } from '@tanstack/react-query';
import {
  PageContainer,
  LoadingState,
  Alert,
  PAGE_FILLS_VIEWPORT_CLASSNAME,
  useToast,
} from '@/components/ui';
import { useAuth, useEncounter, useAutoSave, useCampaignsFull } from '@/hooks';
import { encounterAutosaveBody, persistEncounterSave } from '@/services/encounter-service';
import type { Encounter } from '@/types/encounter';

export type EncounterPlayPageGatePhase = 'loading' | 'error' | 'initializing';

type SaveEncounterMutation = UseMutationResult<
  unknown,
  Error,
  { id: string; data: Partial<Omit<Encounter, 'id' | 'createdAt'>> },
  unknown
>;

export type EncounterPlayAutosaveMode = 'mutation-strip' | 'skill-flush';

export function encounterPlayPageGatePhase({
  isLoading,
  error,
  encounterData,
  encounter,
  requireSkillEncounter,
}: {
  isLoading: boolean;
  error: unknown;
  encounterData: Encounter | null | undefined;
  encounter: Encounter | null;
  requireSkillEncounter?: boolean;
}): 'ready' | EncounterPlayPageGatePhase {
  if (isLoading) return 'loading';
  if (error || (!isLoading && !encounterData)) return 'error';
  if (!encounter) return 'initializing';
  if (requireSkillEncounter && !encounter.skillEncounter) return 'initializing';
  return 'ready';
}

export function EncounterPlayPageGate({
  phase,
  fillsViewport = false,
}: {
  phase: EncounterPlayPageGatePhase;
  fillsViewport?: boolean;
}) {
  const className = fillsViewport ? PAGE_FILLS_VIEWPORT_CLASSNAME : undefined;
  if (phase === 'loading') {
    return (
      <PageContainer size="full" className={className}>
        <LoadingState
          message="Loading encounter..."
          size="lg"
          padding={fillsViewport ? 'lg' : undefined}
        />
      </PageContainer>
    );
  }
  if (phase === 'error') {
    return (
      <PageContainer size="full" className={className}>
        <Alert variant="danger" title="Encounter not found">
          This encounter may have been deleted or you may not have access.
        </Alert>
        <Link href="/encounters" className="mt-4 inline-block text-primary-link-fg hover:underline">
          Back to Encounters
        </Link>
      </PageContainer>
    );
  }
  return (
    <PageContainer size="full" className={className}>
      <LoadingState message="Initializing..." />
    </PageContainer>
  );
}

export function useEncounterPlayPage({
  encounterId,
  saveMutation,
  autosave,
  signedIn = false,
  prepareLoaded,
  autosaveWhenReady,
  requireSkillEncounter,
}: {
  encounterId: string;
  saveMutation: SaveEncounterMutation;
  autosave: EncounterPlayAutosaveMode;
  signedIn?: boolean;
  prepareLoaded?: (data: Encounter) => Encounter;
  autosaveWhenReady?: (encounter: Encounter) => boolean;
  requireSkillEncounter?: boolean;
}) {
  const { data: encounterData, isLoading, error } = useEncounter(encounterId);
  const [encounter, setEncounter] = useState<Encounter | null>(null);
  const [initializedEncounterId, setInitializedEncounterId] = useState<string | null>(null);
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const { data: campaignsFull = [] } = useCampaignsFull();

  if (encounterData && initializedEncounterId !== encounterId) {
    setEncounter(prepareLoaded ? prepareLoaded(encounterData) : encounterData);
    setInitializedEncounterId(encounterId);
  }
  const isInitialized = initializedEncounterId === encounterId;

  const onAutosave = useCallback(
    async (data: Encounter | null, flush?: { unload: boolean }) => {
      if (!data || !encounterId) return;
      if (autosave === 'skill-flush') {
        const body = encounterAutosaveBody(data);
        if (flush?.unload) {
          await persistEncounterSave(encounterId, body, { signedIn, keepalive: true });
          return;
        }
        await saveMutation.mutateAsync({ id: encounterId, data: body });
        return;
      }
      const { id, createdAt, ...rest } = data;
      void id;
      void createdAt;
      await saveMutation.mutateAsync({ id: encounterId, data: rest });
    },
    [autosave, encounterId, saveMutation, signedIn],
  );

  const { user } = useAuth();
  const { showToast } = useToast();
  const autosaveEnabled =
    isInitialized && !!encounter && (autosaveWhenReady ? autosaveWhenReady(encounter) : true);

  const { isSaving, hasUnsavedChanges, syncBlockedByNetwork, saveNow } =
    useAutoSave<Encounter | null>({
      data: encounter,
      onSave: onAutosave,
      delay: 1500,
      enabled: autosaveEnabled,
      onSaveError: () => {
        showToast('Failed to save encounter. Your latest changes may not be stored.', 'error');
      },
    });

  const gatePhase = encounterPlayPageGatePhase({
    isLoading,
    error,
    encounterData,
    encounter,
    ...(requireSkillEncounter !== undefined ? { requireSkillEncounter } : {}),
  });

  const handleCommitName = () => {
    if (!encounter) return;
    const trimmed = nameInput.trim();
    if (trimmed && trimmed !== encounter.name) {
      setEncounter((prev) => (prev ? { ...prev, name: trimmed } : prev));
    } else {
      setNameInput(encounter.name || '');
    }
    setIsEditingName(false);
  };

  const handleCancelEditName = () => {
    if (!encounter) return;
    setNameInput(encounter.name || '');
    setIsEditingName(false);
  };

  const startEditingName = () => {
    if (!encounter) return;
    setNameInput(encounter.name || '');
    setIsEditingName(true);
  };

  return {
    encounter,
    setEncounter,
    campaignsFull,
    user,
    isSaving,
    hasUnsavedChanges,
    syncBlockedByNetwork,
    saveNow,
    gatePhase,
    isEditingName,
    nameInput,
    setNameInput,
    handleCommitName,
    handleCancelEditName,
    startEditingName,
  };
}
