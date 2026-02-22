/**
 * Combat Encounter Page
 * ======================
 * Prisma-backed combat tracker for a specific encounter.
 * Ported from encounter-tracker with persistence via encounter-service.
 */

'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { ChevronLeft, Cloud, CloudOff } from 'lucide-react';
import { ProtectedRoute } from '@/components/layout';
import { LoadingState, PageContainer, Alert } from '@/components/ui';
import { useEncounter, useSaveEncounter, useAutoSave, useCampaignsFull } from '@/hooks';
import { RollProvider } from '@/components/character-sheet';
import type { Encounter } from '@/types/encounter';
import CombatEncounterView from '../_components/CombatEncounterView';

interface PageParams {
  params: Promise<{ id: string }>;
}

export default function CombatEncounterPage({ params }: PageParams) {
  return (
    <ProtectedRoute>
      <CombatEncounterContent params={params} />
    </ProtectedRoute>
  );
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

  const { isSaving, hasUnsavedChanges } = useAutoSave({
    data: encounter,
    onSave: async (data) => {
      if (!data || !encounterId) return;
      const { id: _id, createdAt: _ca, ...rest } = data;
      await saveMutation.mutateAsync({ id: encounterId, data: rest });
    },
    delay: 1500,
    enabled: isInitialized && !!encounter,
    onSaveError: (err) => {
      console.error('Encounter save failed:', err);
    },
  });

  if (isLoading) {
    return (
      <PageContainer size="full">
        <div className="flex items-center justify-center py-20">
          <LoadingState message="Loading encounter..." size="lg" />
        </div>
      </PageContainer>
    );
  }

  if (error || (!isLoading && !encounterData)) {
    return (
      <PageContainer size="full">
        <Alert variant="danger" title="Encounter not found">
          This encounter may have been deleted or you may not have access.
        </Alert>
        <Link href="/encounters" className="mt-4 inline-block text-primary-600 hover:underline">
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

  return (
    <RollProvider>
      <PageContainer size="full">
        <div className="flex items-center justify-between mb-6">
          <div>
            <Link
              href="/encounters"
              className="inline-flex items-center gap-1 text-text-secondary hover:text-primary-600 mb-2 text-sm"
            >
              <ChevronLeft className="w-4 h-4" /> Back to Encounters
            </Link>
            {isEditingName ? (
              <input
                type="text"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                onBlur={() => {
                  const trimmed = nameInput.trim();
                  if (trimmed && trimmed !== encounter.name) {
                    setEncounter((prev) => (prev ? { ...prev, name: trimmed } : prev));
                  } else {
                    setNameInput(encounter.name || '');
                  }
                  setIsEditingName(false);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    const trimmed = nameInput.trim();
                    if (trimmed && trimmed !== encounter.name) {
                      setEncounter((prev) => (prev ? { ...prev, name: trimmed } : prev));
                    }
                    setIsEditingName(false);
                  } else if (e.key === 'Escape') {
                    setNameInput(encounter.name || '');
                    setIsEditingName(false);
                  }
                }}
                className="text-3xl font-bold text-text-primary bg-transparent border-b-2 border-primary-500 outline-none w-full max-w-md"
                autoFocus
              />
            ) : (
              <h1
                className="text-3xl font-bold text-text-primary cursor-pointer hover:text-primary-600 hover:underline"
                onClick={() => setIsEditingName(true)}
                title="Click to edit encounter name"
              >
                {encounter.name}
              </h1>
            )}
            <p className="text-text-secondary">
              Combat Encounter{encounter.description ? ` \u2014 ${encounter.description}` : ''}
            </p>
            <p className="text-xs mt-1 flex items-center gap-1">
              {isSaving ? (
                <span className="text-amber-600 dark:text-amber-400 flex items-center gap-1">
                  <CloudOff className="w-3 h-3" /> Saving...
                </span>
              ) : hasUnsavedChanges ? (
                <span className="text-amber-600 dark:text-amber-400 flex items-center gap-1">
                  <CloudOff className="w-3 h-3" /> Unsaved changes
                </span>
              ) : (
                <span className="text-green-600 dark:text-green-400 flex items-center gap-1">
                  <Cloud className="w-3 h-3" /> Saved to cloud
                </span>
              )}
            </p>
          </div>
        </div>

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
