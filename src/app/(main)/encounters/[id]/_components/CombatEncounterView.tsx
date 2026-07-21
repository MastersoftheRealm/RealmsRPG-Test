/**
 * Combat Encounter View
 * ======================
 * Shared view containing combat encounter play UI.
 * Used by combat/page.tsx and mixed/page.tsx (tab). No PageContainer, header, or loading—parent provides those.
 * Facade (TASK-608): state/handlers in `combat/use-combat-encounter-view`; panels under `combat/`.
 */

"use client";

import { AddCombatantModal } from "@/components/shared";
import { RollLog } from "@/components/rolls";
import type { Encounter } from "@/types/encounter";
import { useCombatEncounterView } from "./combat/use-combat-encounter-view";
import { CombatRoundControls } from "./combat/combat-round-controls";
import { CombatCombatantList } from "./combat/combat-combatant-list";
import { CombatAddSidebar } from "./combat/combat-add-sidebar";
import type { CombatEncounterViewProps } from "./combat/combat-encounter-view-props";

export type { CombatEncounterViewProps } from "./combat/combat-encounter-view-props";
export {
  generateId,
  rollInitiative,
  sortCombatantsForTurnOrder,
} from "./combat/combat-encounter-helpers";

export default function CombatEncounterView(props: CombatEncounterViewProps) {
  if (props.encounter === null) return null;
  return <CombatEncounterViewInner {...props} encounter={props.encounter} />;
}

function CombatEncounterViewInner(
  props: CombatEncounterViewProps & { encounter: Encounter },
) {
  const model = useCombatEncounterView(props);
  const {
    encounter,
    setEncounter,
    campaignsFull,
    showRollLog,
    user,
    showAddModal,
    setShowAddModal,
    addingAllChars,
    newCombatant,
    setNewCombatant,
    draggedId,
    dragOverId,
    sortedCombatants,
    linkedCampaign,
  } = model;

  return (
    <>
      <div className="grid lg:grid-cols-4 gap-6 lg:items-stretch">
        <div className="lg:col-span-3 flex flex-col gap-4 min-h-0">
          <CombatRoundControls
            encounter={encounter}
            setEncounter={setEncounter}
            onStartCombat={model.startCombat}
            onPreviousTurn={model.previousTurn}
            onNextTurn={model.nextTurn}
            onSortInitiative={model.sortInitiative}
            onEndCombat={model.endCombat}
            onMarkCompleted={model.markCompleted}
            onResetEncounter={model.resetEncounter}
          />
          <CombatCombatantList
            encounter={encounter}
            sortedCombatants={sortedCombatants}
            userId={user?.uid}
            draggedId={draggedId}
            dragOverId={dragOverId}
            onUpdate={model.updateCombatant}
            onRemove={model.removeCombatant}
            onDuplicate={model.duplicateCombatant}
            onAddCondition={model.addCondition}
            onRemoveCondition={model.removeCondition}
            onUpdateConditionLevel={model.updateConditionLevel}
            onUpdateAP={model.updateAP}
            onDragStart={model.handleDragStart}
            onDragEnd={model.handleDragEnd}
            onDragOver={model.handleDragOver}
            onDragLeave={model.handleDragLeave}
            onDrop={model.handleDrop}
          />
        </div>

        <CombatAddSidebar
          encounter={encounter}
          setEncounter={setEncounter}
          campaignsFull={campaignsFull}
          linkedCampaign={linkedCampaign}
          addingAllChars={addingAllChars}
          newCombatant={newCombatant}
          setNewCombatant={setNewCombatant}
          onOpenAddModal={() => setShowAddModal(true)}
          onAddAllCampaignCharacters={model.addAllCampaignCharacters}
          onAddCombatant={model.addCombatant}
        />
      </div>

      {showAddModal && (
        <AddCombatantModal
          onClose={() => setShowAddModal(false)}
          onAdd={model.addCombatantsFromModal}
          mode="combat"
        />
      )}

      {showRollLog && <RollLog viewOnlyCampaignId={encounter.campaignId} />}
    </>
  );
}
