/**
 * Skill Encounter View
 * =====================
 * Shared view containing skill encounter play UI.
 * Used by skill/page.tsx and mixed/page.tsx (tab). No PageContainer, header, or loading—parent provides those.
 * Per GAME_RULES: roll ≥ DS = 1 + floor((roll-DS)/5) successes; roll < DS = 1 + floor((DS-roll)/5) failures.
 * Facade (TASK-608): state/handlers in `skill/use-skill-encounter-view`; panels under `skill/`.
 */

"use client";

import { AddCombatantModal } from "@/components/shared";
import { RollLog } from "@/components/rolls";
import type { Encounter, SkillEncounterState } from "@/types/encounter";
import { useSkillEncounterView } from "./skill/use-skill-encounter-view";
import { SkillTrackersSection } from "./skill/skill-trackers-section";
import { SkillParticipantList } from "./skill/skill-participant-list";
import { SkillSidebar } from "./skill/skill-sidebar";
import type { SkillEncounterViewProps } from "./skill/skill-encounter-view-props";

type EncounterWithSkillEncounter = Encounter & {
  skillEncounter: SkillEncounterState;
};

export default function SkillEncounterView(props: SkillEncounterViewProps) {
  if (props.encounter === null || props.encounter.skillEncounter === undefined)
    return null;
  return (
    <SkillEncounterViewInner
      {...props}
      encounter={props.encounter as EncounterWithSkillEncounter}
    />
  );
}

function SkillEncounterViewInner(
  props: SkillEncounterViewProps & { encounter: EncounterWithSkillEncounter },
) {
  const model = useSkillEncounterView(props);
  const {
    encounter,
    setEncounter,
    campaignsFull,
    showRollLog,
    isMixedEncounter,
    showAddModal,
    setShowAddModal,
    newParticipantName,
    setNewParticipantName,
    addingAllChars,
    codexSkills,
    skill,
    additionalSuccesses,
    additionalFailures,
    derivedRollSuccesses,
    derivedRollFailures,
    requiredSuccesses,
    maxFailures,
    encounterOutcome,
    sequenceSuccesses,
    sequenceFailures,
    linkedCampaign,
    useInitiative,
    draggedId,
    dragOverId,
    sortedParticipants,
    combatTurnOrder,
  } = model;

  return (
    <>
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <SkillTrackersSection
            derivedRollSuccesses={derivedRollSuccesses}
            derivedRollFailures={derivedRollFailures}
            additionalSuccesses={additionalSuccesses}
            additionalFailures={additionalFailures}
            requiredSuccesses={requiredSuccesses}
            maxFailures={maxFailures}
            encounterOutcome={encounterOutcome}
            sequenceSuccesses={sequenceSuccesses}
            sequenceFailures={sequenceFailures}
            participantCount={skill.participants.length}
            actedCount={
              skill.participants.filter((p) => p.hasRolled || p.isHelping)
                .length
            }
            updateSkill={model.updateSkill}
            onResetEncounter={model.resetEncounter}
          />
          <SkillParticipantList
            sortedParticipants={sortedParticipants}
            difficultyScore={skill.difficultyScore}
            codexSkills={codexSkills}
            useInitiative={useInitiative}
            draggedId={draggedId}
            dragOverId={dragOverId}
            onUpdateRoll={model.updateParticipantRollOnly}
            onUpdateSkill={model.updateParticipantSkill}
            onUpdateRmBonus={model.updateParticipantRmBonus}
            onClearRoll={model.clearParticipantRoll}
            onSetHelping={model.setParticipantHelping}
            onRemove={model.removeParticipant}
            onUpdateParticipantType={model.updateParticipantType}
            onRollInitiative={model.rollInitiativeForParticipant}
            onDragStart={model.handleDragStart}
            onDragEnd={model.handleDragEnd}
            onDragOver={model.handleDragOver}
            onDragLeave={model.handleDragLeave}
            onDrop={model.handleDrop}
          />
        </div>

        <SkillSidebar
          encounter={encounter}
          setEncounter={setEncounter}
          campaignsFull={campaignsFull}
          linkedCampaign={linkedCampaign}
          skill={skill}
          requiredSuccesses={requiredSuccesses}
          maxFailures={maxFailures}
          encounterOutcome={encounterOutcome}
          useInitiative={useInitiative}
          isMixedEncounter={isMixedEncounter}
          combatTurnOrderLength={combatTurnOrder.length}
          addingAllChars={addingAllChars}
          newParticipantName={newParticipantName}
          setNewParticipantName={setNewParticipantName}
          updateSkill={model.updateSkill}
          recomputeParticipantRollsFromDs={model.recomputeParticipantRollsFromDs}
          onSortByInitiative={model.sortByInitiative}
          onSyncWithCombatOrder={model.syncWithCombatOrder}
          onCopyCombatantsToSkill={model.copyCombatantsToSkill}
          onAddAllCampaignCharacters={model.addAllCampaignCharacters}
          onOpenAddModal={() => setShowAddModal(true)}
          onAddParticipant={model.addParticipant}
        />
      </div>

      {showAddModal && (
        <AddCombatantModal
          onClose={() => setShowAddModal(false)}
          onAdd={model.addCombatantsAsParticipants}
          onAddParticipants={model.addParticipantsFromModal}
          mode="skill"
        />
      )}

      {showRollLog && <RollLog viewOnlyCampaignId={encounter.campaignId} />}
    </>
  );
}
