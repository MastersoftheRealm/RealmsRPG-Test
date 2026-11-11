/**
 * Mixed Encounter Page
 * =====================
 * Combines combat and skill encounter functionality in a tab-based view.
 * Reuses CombatEncounterView and SkillEncounterView; both states on the same Encounter document.
 */

'use client';

import { useState, use, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { Swords, Brain } from 'lucide-react';
import { PageContainer } from '@/components/ui';
import { CloudSyncOfflineBanner, SegmentedControl } from '@/components/patterns';
import { useSaveEncounter } from '@/hooks';
import { RollProvider, RollLog } from '@/components/rolls';
import type { Encounter } from '@/types/encounter';
import { defaultSkillEncounterState } from '@/types/encounter';
import CombatEncounterView from '../_components/CombatEncounterView';
import SkillEncounterView from '../_components/SkillEncounterView';
import { EncounterPageHeader } from '../_components/EncounterPageHeader';
import { OpenTabletopButton } from '../_components/OpenTabletopButton';
import {
  EncounterPlayPageGate,
  useEncounterPlayPage,
} from '../_components/encounter-play-page-shell';
import {
  readMixedEncounterViewTab,
  writeMixedEncounterViewTab,
  type MixedEncounterViewTab,
} from '@/lib/game/mixed-encounter-view-tab';

type ViewTab = MixedEncounterViewTab;

interface PageParams {
  params: Promise<{ id: string }>;
}

function prepareMixedEncounter(encounter: Encounter): Encounter {
  if (!encounter.skillEncounter) {
    return {
      ...encounter,
      skillEncounter: { ...defaultSkillEncounterState(), useInitiative: true },
    };
  }

  const skill = encounter.skillEncounter;
  const participants = skill.participants ?? [];
  return {
    ...encounter,
    skillEncounter: {
      ...skill,
      participants,
      additionalSuccesses: skill.additionalSuccesses ?? 0,
      additionalFailures: skill.additionalFailures ?? 0,
      requiredSuccesses: skill.requiredSuccesses ?? Math.max(1, participants.length + 1),
      maxFailures: skill.maxFailures ?? 3,
      useInitiative: skill.useInitiative ?? true,
    },
  };
}

export default function MixedEncounterPage({ params }: PageParams) {
  return <MixedEncounterContent params={params} />;
}

function MixedEncounterContent({ params }: { params: Promise<{ id: string }> }) {
  const { id: encounterId } = use(params);
  const saveMutation = useSaveEncounter();
  const play = useEncounterPlayPage({
    encounterId,
    saveMutation,
    autosave: 'mutation-strip',
    prepareLoaded: prepareMixedEncounter,
  });

  const [viewForEncounter, setViewForEncounter] = useState(() => ({
    encounterId,
    tab: readMixedEncounterViewTab(encounterId),
  }));
  if (viewForEncounter.encounterId !== encounterId) {
    setViewForEncounter({
      encounterId,
      tab: readMixedEncounterViewTab(encounterId),
    });
  }
  const activeView = viewForEncounter.tab;

  const handleActiveViewChange = useCallback(
    (tab: ViewTab) => {
      setViewForEncounter((prev) => ({ ...prev, tab }));
      writeMixedEncounterViewTab(encounterId, tab);
    },
    [encounterId],
  );

  if (play.gatePhase !== 'ready') {
    return <EncounterPlayPageGate phase={play.gatePhase} />;
  }
  if (!play.encounter) {
    return <EncounterPlayPageGate phase="initializing" />;
  }

  const encounter = play.encounter;

  return (
    <RollProvider>
      <PageContainer size="full">
        <EncounterPageHeader
          encounterType="Mixed"
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

        <SegmentedControl
          value={activeView}
          onChange={handleActiveViewChange}
          equalWidth
          options={[
            {
              value: 'combat',
              label: 'Combat',
              icon: <Swords className="h-4 w-4" aria-hidden />,
            },
            {
              value: 'skill',
              label: 'Skill',
              icon: <Brain className="h-4 w-4" aria-hidden />,
            },
          ]}
          aria-label="Mixed encounter view"
          className="mb-6 max-w-xs"
        />

        <div className={cn(activeView !== 'combat' && 'hidden')}>
          <CombatEncounterView
            encounterId={encounterId}
            encounter={encounter}
            setEncounter={play.setEncounter}
            campaignsFull={play.campaignsFull}
            showRollLog={false}
          />
        </div>
        <div className={cn(activeView !== 'skill' && 'hidden')}>
          <SkillEncounterView
            encounterId={encounterId}
            encounter={encounter}
            setEncounter={play.setEncounter}
            campaignsFull={play.campaignsFull}
            showRollLog={false}
            isMixedEncounter
          />
        </div>

        <RollLog viewOnlyCampaignId={encounter.campaignId} />
      </PageContainer>
    </RollProvider>
  );
}
