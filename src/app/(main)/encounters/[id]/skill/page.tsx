/**
 * Skill Encounter Page
 * =====================
 * Skill encounter tracker: DS, participants, roll tracking, success/failure.
 * Per GAME_RULES: roll >= DS = 1 + floor((roll-DS)/5) successes; roll < DS = 1 + floor((DS-roll)/5) failures.
 */

'use client';

import { use } from 'react';
import { PageContainer } from '@/components/ui';
import { CloudSyncOfflineBanner } from '@/components/patterns';
import { RollProvider } from '@/components/rolls';
import SkillEncounterView from '../_components/SkillEncounterView';
import { prepareSkillEncounter } from './prepare-skill-encounter';
import { EncounterPageHeader } from '../_components/EncounterPageHeader';
import {
  EncounterPlayPageGate,
  useEncounterPlayPage,
} from '../_components/encounter-play-page-shell';

interface PageParams {
  params: Promise<{ id: string }>;
}

export default function SkillEncounterPage({ params }: PageParams) {
  return <SkillEncounterContent params={params} />;
}

function SkillEncounterContent({ params }: { params: Promise<{ id: string }> }) {
  const { id: encounterId } = use(params);
  const play = useEncounterPlayPage({
    encounterId,
    keepaliveOnUnload: true,
    requireSkillEncounter: true,
    prepareLoaded: prepareSkillEncounter,
  });

  if (play.gatePhase !== 'ready') {
    return <EncounterPlayPageGate phase={play.gatePhase} />;
  }

  const encounter = play.encounter;

  return (
    <RollProvider>
      <PageContainer size="full">
        <EncounterPageHeader
          encounterType="Skill"
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
        />

        <CloudSyncOfflineBanner
          enabled={!!play.user}
          syncBlocked={play.syncBlockedByNetwork}
          onRetry={() => void play.saveNow()}
        />

        <SkillEncounterView
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
