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
import { ChevronLeft, Cloud, CloudOff, Swords, Brain } from 'lucide-react';
import { ProtectedRoute } from '@/components/layout';
import { PageContainer, LoadingState, Alert } from '@/components/ui';
import { useEncounter, useSaveEncounter, useAutoSave, useCampaignsFull } from '@/hooks';
import { RollProvider, RollLog } from '@/components/character-sheet';
import type { Encounter } from '@/types/encounter';
import CombatEncounterView from '../_components/CombatEncounterView';
import SkillEncounterView from '../_components/SkillEncounterView';

type ViewTab = 'combat' | 'skill';

interface PageParams {
  params: Promise<{ id: string }>;
}

export default function MixedEncounterPage({ params }: PageParams) {
  return (
    <ProtectedRoute>
      <MixedEncounterContent params={params} />
    </ProtectedRoute>
  );
}

function MixedEncounterContent({ params }: { params: Promise<{ id: string }> }) {
  const { id: encounterId } = use(params);
  const { data: encounterData, isLoading, error } = useEncounter(encounterId);
  const saveMutation = useSaveEncounter();
  const [encounter, setEncounter] = useState<Encounter | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [activeView, setActiveView] = useState<ViewTab>('combat');
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
        if (sk.additionalSuccesses == null) sk.additionalSuccesses = 0;
        if (sk.additionalFailures == null) sk.additionalFailures = 0;
      }
      setEncounter(enc);
      setIsInitialized(true);
    }
  }, [encounterData, isInitialized]);

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
        <div className="mb-6">
          <Link
            href="/encounters"
            className="inline-flex items-center gap-1 text-text-secondary hover:text-primary-600 mb-2 text-sm"
          >
            <ChevronLeft className="w-4 h-4" /> Back to Encounters
          </Link>
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-text-primary">{encounter.name}</h1>
              <p className="text-text-secondary">
                Mixed Encounter{encounter.description ? ` \u2014 ${encounter.description}` : ''}
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

        <div className="flex gap-1 mb-6 p-1 bg-surface-alt rounded-lg max-w-xs">
          <button
            onClick={() => setActiveView('combat')}
            className={cn(
              'flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-colors',
              activeView === 'combat' ? 'bg-surface text-text-primary shadow-sm' : 'text-text-muted hover:text-text-secondary'
            )}
          >
            <Swords className="w-4 h-4" /> Combat
          </button>
          <button
            onClick={() => setActiveView('skill')}
            className={cn(
              'flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-colors',
              activeView === 'skill' ? 'bg-surface text-text-primary shadow-sm' : 'text-text-muted hover:text-text-secondary'
            )}
          >
            <Brain className="w-4 h-4" /> Skill
          </button>
        </div>

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
          />
        </div>

        <RollLog viewOnlyCampaignId={encounter.campaignId} />
      </PageContainer>
    </RollProvider>
  );
}
