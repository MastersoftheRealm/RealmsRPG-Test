'use client';

import { useState } from 'react';
import { useToast } from '@/components/ui';
import { useAuth, useEncounter, useAutoSave, useCampaignsFull } from '@/hooks';
import type { Encounter } from '@/types/encounter';
import { encounterPlayPageGatePhase } from './EncounterPlayPageGate';

export type EncounterAutosaveHandler = (
  data: Encounter | null,
  flush?: { unload: boolean },
) => Promise<void>;

export interface UseEncounterPlayPageOptions {
  encounterId: string;
  prepareLoaded?: (data: Encounter) => Encounter;
  onAutosave: EncounterAutosaveHandler;
  /** When false, autosave stays disabled even after the encounter is initialized. */
  autosaveWhenReady?: (encounter: Encounter) => boolean;
  requireSkillEncounter?: boolean;
}

export function useEncounterPlayPage({
  encounterId,
  prepareLoaded,
  onAutosave,
  autosaveWhenReady,
  requireSkillEncounter,
}: UseEncounterPlayPageOptions) {
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
