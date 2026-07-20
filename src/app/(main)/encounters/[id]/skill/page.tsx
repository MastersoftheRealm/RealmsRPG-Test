/**
 * Skill Encounter Page
 * =====================
 * Skill encounter tracker: DS, participants, roll tracking, success/failure.
 * Per GAME_RULES: roll >= DS = 1 + floor((roll-DS)/5) successes; roll < DS = 1 + floor((DS-roll)/5) failures.
 */

"use client";

import { useState, use } from "react";
import Link from "next/link";
import { PageContainer, LoadingState, Alert, useToast } from "@/components/ui";
import {
  useEncounter,
  useSaveEncounter,
  useAutoSave,
  useCampaignsFull,
} from "@/hooks";
import { RollProvider } from "@/components/rolls";
import type { Encounter } from "@/types/encounter";
import { defaultSkillEncounterState } from "@/types/encounter";
import { computeSkillRollResult } from "@/lib/game/encounter-utils";
import SkillEncounterView from "../_components/SkillEncounterView";
import { EncounterPageHeader } from "../_components/EncounterPageHeader";

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
      requiredSuccesses:
        skill.requiredSuccesses ?? Math.max(1, participants.length + 1),
      maxFailures: skill.maxFailures ?? 3,
    },
  };
}

export default function SkillEncounterPage({ params }: PageParams) {
  return <SkillEncounterContent params={params} />;
}

function SkillEncounterContent({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: encounterId } = use(params);
  const { data: encounterData, isLoading, error } = useEncounter(encounterId);
  const saveMutation = useSaveEncounter();
  const [encounter, setEncounter] = useState<Encounter | null>(null);
  const [initializedEncounterId, setInitializedEncounterId] = useState<
    string | null
  >(null);
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameInput, setNameInput] = useState("");
  const { data: campaignsFull = [] } = useCampaignsFull();

  if (encounterData && initializedEncounterId !== encounterId) {
    setEncounter(prepareSkillEncounter(encounterData));
    setInitializedEncounterId(encounterId);
  }
  const isInitialized = initializedEncounterId === encounterId;

  const { showToast } = useToast();
  const { isSaving, hasUnsavedChanges } = useAutoSave({
    data: encounter,
    onSave: async (data) => {
      if (!data || !encounterId) return;
      const { id, createdAt, ...rest } = data;
      void id;
      void createdAt;
      await saveMutation.mutateAsync({ id: encounterId, data: rest });
    },
    delay: 1500,
    enabled: isInitialized && !!encounter,
    onSaveError: () => {
      showToast(
        "Failed to save encounter. Your latest changes may not be stored.",
        "error",
      );
    },
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
        <Link
          href="/encounters"
          className="mt-4 inline-block text-primary-link-fg hover:underline"
        >
          Back to Encounters
        </Link>
      </PageContainer>
    );
  }

  if (!encounter || !encounter.skillEncounter) {
    return (
      <PageContainer size="full">
        <LoadingState message="Initializing..." />
      </PageContainer>
    );
  }

  const handleCommitName = () => {
    const trimmed = nameInput.trim();
    if (trimmed && trimmed !== encounter.name) {
      setEncounter((prev) => (prev ? { ...prev, name: trimmed } : prev));
    } else {
      setNameInput(encounter.name || "");
    }
    setIsEditingName(false);
  };

  const handleCancelEditName = () => {
    setNameInput(encounter.name || "");
    setIsEditingName(false);
  };

  return (
    <RollProvider>
      <PageContainer size="full">
        <EncounterPageHeader
          encounterType="Skill"
          name={encounter.name}
          description={encounter.description}
          isEditingName={isEditingName}
          nameInput={nameInput}
          onNameInputChange={setNameInput}
          onStartEditingName={() => {
            setNameInput(encounter.name || "");
            setIsEditingName(true);
          }}
          onCommitName={handleCommitName}
          onCancelEdit={handleCancelEditName}
          isSaving={isSaving}
          hasUnsavedChanges={hasUnsavedChanges}
        />

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
