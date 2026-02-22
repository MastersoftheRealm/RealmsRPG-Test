/**
 * Skill Encounter Page
 * =====================
 * Skill encounter tracker: DS, participants, roll tracking, success/failure.
 * Per GAME_RULES: roll >= DS = 1 + floor((roll-DS)/5) successes; roll < DS = 1 + floor((DS-roll)/5) failures.
 */

'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { ChevronLeft, Cloud, CloudOff } from 'lucide-react';
import { ProtectedRoute } from '@/components/layout';
import { PageContainer, LoadingState, Alert } from '@/components/ui';
import { useEncounter, useSaveEncounter, useAutoSave, useCampaignsFull } from '@/hooks';
import { RollProvider } from '@/components/character-sheet';
import type { Encounter, SkillParticipant } from '@/types/encounter';
import { computeSkillRollResult } from '@/lib/game/encounter-utils';
import SkillEncounterView from '../_components/SkillEncounterView';

interface PageParams {
  params: Promise<{ id: string }>;
}

export default function SkillEncounterPage({ params }: PageParams) {
  return (
    <ProtectedRoute>
      <SkillEncounterContent params={params} />
    </ProtectedRoute>
  );
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
        };
      } else {
        const sk = enc.skillEncounter as unknown as Record<string, unknown>;
        delete sk.requiredSuccesses;
        delete sk.requiredFailures;
        const participants = (sk.participants as SkillParticipant[]) || [];
        const ds = (sk.difficultyScore as number) ?? 10;
        sk.participants = participants.map((p) => {
          if (
            p.hasRolled &&
            p.rollValue != null &&
            (p.successCount == null && p.failureCount == null)
          ) {
            const { successes, failures } = computeSkillRollResult(p.rollValue, ds);
            return { ...p, successCount: successes, failureCount: failures };
          }
          return p;
        });
      }
      setNameInput(enc.name || '');
      setEncounter(enc);
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
  });

  if (isLoading) {
    return (
      <PageContainer size="xl">
        <LoadingState message="Loading encounter..." size="lg" />
      </PageContainer>
    );
  }

  if (error || (!isLoading && !encounterData)) {
    return (
      <PageContainer size="xl">
        <Alert variant="danger" title="Encounter not found">
          This encounter may have been deleted or you may not have access.
        </Alert>
        <Link href="/encounters" className="mt-4 inline-block text-primary-600 hover:underline">
          Back to Encounters
        </Link>
      </PageContainer>
    );
  }

  if (!encounter || !encounter.skillEncounter) {
    return (
      <PageContainer size="xl">
        <LoadingState message="Initializing..." />
      </PageContainer>
    );
  }

  return (
    <RollProvider>
      <PageContainer size="xl">
        <div className="mb-6">
          <Link
            href="/encounters"
            className="inline-flex items-center gap-1 text-text-secondary hover:text-primary-600 mb-2 text-sm"
          >
            <ChevronLeft className="w-4 h-4" /> Back to Encounters
          </Link>
          <div className="flex items-start justify-between">
            <div>
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
                Skill Encounter{encounter.description ? ` \u2014 ${encounter.description}` : ''}
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
        </div>

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
