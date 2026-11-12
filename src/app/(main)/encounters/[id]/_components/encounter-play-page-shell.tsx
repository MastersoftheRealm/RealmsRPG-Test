'use client';

import Link from 'next/link';
import { useCallback, useState, type Dispatch, type SetStateAction } from 'react';
import {
  PageContainer,
  LoadingState,
  Alert,
  PAGE_FILLS_VIEWPORT_CLASSNAME,
  useToast,
} from '@/components/ui';
import { useAuth, useEncounter, useAutoSave, useCampaignsFull, useSaveEncounter } from '@/hooks';
import { encounterAutosaveBody, persistEncounterSave } from '@/services/encounter-service';
import type { Encounter } from '@/types/encounter';
import type { Campaign } from '@/types/campaign';

export type EncounterPlayPageGatePhase = 'loading' | 'error' | 'initializing';

export type EncounterPlayPageShared = {
  setEncounter: Dispatch<SetStateAction<Encounter | null>>;
  campaignsFull: Campaign[];
  user: ReturnType<typeof useAuth>['user'];
  isSaving: boolean;
  hasUnsavedChanges: boolean;
  syncBlockedByNetwork: boolean;
  saveNow: () => Promise<void>;
  isEditingName: boolean;
  nameInput: string;
  setNameInput: Dispatch<SetStateAction<string>>;
  handleCommitName: () => void;
  handleCancelEditName: () => void;
  startEditingName: () => void;
};

export type EncounterPlayPageResult =
  | (EncounterPlayPageShared & { gatePhase: 'ready'; encounter: Encounter })
  | (EncounterPlayPageShared & {
      gatePhase: EncounterPlayPageGatePhase;
      encounter: Encounter | null;
    });

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
  if (error || !encounterData) return 'error';
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
  keepaliveOnUnload = false,
  prepareLoaded,
  requireSkillEncounter,
}: {
  encounterId: string;
  /** Skill play route: unload flush uses keepalive persist (combat/mixed use mutation only). */
  keepaliveOnUnload?: boolean;
  prepareLoaded?: (data: Encounter) => Encounter;
  /** Skill play: stay on initializing until `skillEncounter` is hydrated. */
  requireSkillEncounter?: boolean;
}): EncounterPlayPageResult {
  const { data: encounterData, isLoading, error } = useEncounter(encounterId);
  const saveMutation = useSaveEncounter();
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
  const signedIn = Boolean(user);

  const onAutosave = useCallback(
    async (data: Encounter | null, flush?: { unload: boolean }) => {
      if (!data || !encounterId) return;
      const body = encounterAutosaveBody(data);
      if (keepaliveOnUnload && flush?.unload) {
        await persistEncounterSave(encounterId, body, { signedIn, keepalive: true });
        return;
      }
      await saveMutation.mutateAsync({ id: encounterId, data: body });
    },
    [encounterId, keepaliveOnUnload, saveMutation, signedIn],
  );

  const { showToast } = useToast();
  const autosaveEnabled = !isLoading && isInitialized && Boolean(encounter);

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
    if (!trimmed) {
      setNameInput(encounter.name || '');
      setIsEditingName(false);
      return;
    }
    if (trimmed !== encounter.name) {
      setEncounter((prev) => (prev ? { ...prev, name: trimmed } : prev));
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

  const shared: EncounterPlayPageShared = {
    setEncounter,
    campaignsFull,
    user,
    isSaving,
    hasUnsavedChanges,
    syncBlockedByNetwork,
    saveNow,
    isEditingName,
    nameInput,
    setNameInput,
    handleCommitName,
    handleCancelEditName,
    startEditingName,
  };

  if (gatePhase === 'ready' && encounter) {
    return { ...shared, gatePhase: 'ready', encounter };
  }

  const blockedPhase: EncounterPlayPageGatePhase =
    gatePhase === 'ready' ? 'initializing' : gatePhase;

  return {
    ...shared,
    gatePhase: blockedPhase,
    encounter,
  };
}
