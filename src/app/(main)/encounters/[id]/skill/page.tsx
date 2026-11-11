/**
 * Skill Encounter Page
 * =====================
 * Skill encounter tracker: DS, participants, roll tracking, success/failure.
 * Per GAME_RULES: roll >= DS = 1 + floor((roll-DS)/5) successes; roll < DS = 1 + floor((DS-roll)/5) failures.
 */

'use client';

import { use, useMemo } from 'react';
import { PageContainer } from '@/components/ui';
import { CloudSyncOfflineBanner } from '@/components/patterns';
import { useAuth, useSaveEncounter } from '@/hooks';
import { RollProvider } from '@/components/rolls';
import type { Encounter } from '@/types/encounter';
import { defaultSkillEncounterState } from '@/types/encounter';
import { computeSkillRollResult } from '@/lib/game/encounter-utils';
import SkillEncounterView from '../_components/SkillEncounterView';
import { EncounterPageHeader } from '../_components/EncounterPageHeader';
import { EncounterPlayPageGate } from '../_components/EncounterPlayPageGate';
import { skillEncounterAutosaveHandler } from '../_components/encounter-play-autosave';
import { useEncounterPlayPage } from '../_components/use-encounter-play-page';

interface PageParams {
  params: Promise<{ id: string }>;
}

function prepareSkillEncounter(encounter: Encounter): Encounter {
  if (!encounter.skillEncounter) {
    return { ...encounter, skillEncounter: defaultSkillEncounterState() };
  }

  const skill = encounter.skillEncounter;
  const participants = skill.participants ?? [];
  const difficultyScore = skill.difficultyScore ?? 10;
  return {
    ...encounter,
    skillEncounter: {
      ...skill,
      difficultyScore,
      participants: participants.map((participant) => {
        if (
          participant.hasRolled &&
          participant.rollValue != null &&
          participant.successCount == null &&
          participant.failureCount == null
        ) {
          const { successes, failures } = computeSkillRollResult(
            participant.rollValue + (participant.rmBonus ?? 0),
            difficultyScore,
          );
          return {
            ...participant,
            successCount: successes,
            failureCount: failures,
          };
        }
        return participant;
      }),
      additionalSuccesses: skill.additionalSuccesses ?? 0,
      additionalFailures: skill.additionalFailures ?? 0,
      requiredSuccesses: skill.requiredSuccesses ?? Math.max(1, participants.length + 1),
      maxFailures: skill.maxFailures ?? 3,
    },
  };
}

export default function SkillEncounterPage({ params }: PageParams) {
  return <SkillEncounterContent params={params} />;
}

function SkillEncounterContent({ params }: { params: Promise<{ id: string }> }) {
  const { id: encounterId } = use(params);
  const { user } = useAuth();
  const saveMutation = useSaveEncounter();
  const onAutosave = useMemo(
    () => skillEncounterAutosaveHandler(encounterId, saveMutation, !!user),
    [encounterId, saveMutation, user],
  );

  const play = useEncounterPlayPage({
    encounterId,
    prepareLoaded: prepareSkillEncounter,
    onAutosave,
    requireSkillEncounter: true,
  });

  if (play.gatePhase !== 'ready') {
    return <EncounterPlayPageGate phase={play.gatePhase} />;
  }
  if (!play.encounter?.skillEncounter) {
    return <EncounterPlayPageGate phase="initializing" />;
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
