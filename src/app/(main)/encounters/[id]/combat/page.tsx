/**
 * Combat Encounter Page
 * ======================
 * Supabase-backed combat tracker for a specific encounter.
 * Ported from encounter-tracker with persistence via encounter-service.
 */

'use client';

import { use, useMemo } from 'react';
import { PageContainer, PAGE_FILLS_VIEWPORT_CLASSNAME } from '@/components/ui';
import { CloudSyncOfflineBanner } from '@/components/patterns';
import { useSaveEncounter } from '@/hooks';
import { RollProvider } from '@/components/rolls';
import CombatEncounterView from '../_components/CombatEncounterView';
import { EncounterPageHeader } from '../_components/EncounterPageHeader';
import { OpenTabletopButton } from '../_components/OpenTabletopButton';
import {
  EncounterPlayPageGate,
  encounterMutationAutosaveHandler,
  useEncounterPlayPage,
} from '../_components/encounter-play-page-shell';

interface PageParams {
  params: Promise<{ id: string }>;
}

export default function CombatEncounterPage({ params }: PageParams) {
  return <CombatEncounterContent params={params} />;
}

function CombatEncounterContent({ params }: { params: Promise<{ id: string }> }) {
  const { id: encounterId } = use(params);
  const saveMutation = useSaveEncounter();
  const onAutosave = useMemo(
    () => encounterMutationAutosaveHandler(encounterId, saveMutation),
    [encounterId, saveMutation],
  );

  const play = useEncounterPlayPage({
    encounterId,
    onAutosave,
  });

  if (play.gatePhase !== 'ready') {
    return <EncounterPlayPageGate phase={play.gatePhase} fillsViewport />;
  }
  if (!play.encounter) {
    return <EncounterPlayPageGate phase="initializing" fillsViewport />;
  }

  const encounter = play.encounter;

  return (
    <RollProvider>
      <PageContainer size="full" className={PAGE_FILLS_VIEWPORT_CLASSNAME}>
        <EncounterPageHeader
          encounterType="Combat"
          name={encounter.name}
          description={encounter.description}
          isEditingName={play.isEditingName}
          nameInput={play.nameInput}
          onNameInputChange={play.setNameInput}
          onStartEditingName={play.startEditingName}
          onCommitName={play.handleCommitName}
          onCancelEdit={play.handleCancelEditName}
          isSaving={play.isSaving}
          hasUnsavedChanges={play.hasUnsavedChanges}
          actions={
            <OpenTabletopButton
              encounterId={encounterId}
              campaignId={encounter.campaignId}
              onBeforeOpen={play.saveNow}
            />
          }
        />

        <CloudSyncOfflineBanner
          enabled={!!play.user}
          syncBlocked={play.syncBlockedByNetwork}
          onRetry={() => void play.saveNow()}
        />

        <CombatEncounterView
          encounterId={encounterId}
          encounter={encounter}
          setEncounter={play.setEncounter}
          campaignsFull={play.campaignsFull}
          showRollLog
        />
      </PageContainer>
    </RollProvider>
  );
}
