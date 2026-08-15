/**
 * Combat encounter view state + handlers (TASK-608 / TASK-666a)
 * ============================================================
 * Facade composing linked-character sync, roster actions, and round controls.
 * Presentation lives in sibling panels.
 */

'use client';

import { useMemo } from 'react';
import type { Encounter } from '@/types/encounter';
import type { CombatEncounterViewProps } from './combat-encounter-view-props';
import { sortCombatantsForTurnOrder } from './combat-encounter-helpers';
import { useCombatLinkedCharacterSync } from './use-combat-linked-character-sync';
import { useCombatRosterActions } from './use-combat-roster-actions';
import { useCombatRoundActions } from './use-combat-round-actions';

export function useCombatEncounterView({
  encounterId,
  encounter,
  setEncounter,
  campaignsFull,
  showRollLog = true,
}: CombatEncounterViewProps & { encounter: Encounter }) {
  useCombatLinkedCharacterSync({ encounterId, encounter, setEncounter });

  const roster = useCombatRosterActions({
    encounter,
    setEncounter,
    campaignsFull,
  });

  const sortedCombatants = useMemo(() => {
    if (!encounter) return [];
    return sortCombatantsForTurnOrder(encounter.combatants, encounter.round);
  }, [encounter]);

  const round = useCombatRoundActions({ setEncounter, sortedCombatants });

  return {
    encounter,
    setEncounter,
    campaignsFull,
    showRollLog,
    user: roster.user,
    showAddModal: roster.showAddModal,
    setShowAddModal: roster.setShowAddModal,
    addingAllChars: roster.addingAllChars,
    newCombatant: roster.newCombatant,
    setNewCombatant: roster.setNewCombatant,
    draggedId: roster.draggedId,
    dragOverId: roster.dragOverId,
    sortedCombatants,
    linkedCampaign: roster.linkedCampaign,
    handleDragStart: roster.handleDragStart,
    handleDragEnd: roster.handleDragEnd,
    handleDragOver: roster.handleDragOver,
    handleDragLeave: roster.handleDragLeave,
    handleDrop: roster.handleDrop,
    addCombatant: roster.addCombatant,
    addCombatantsFromModal: roster.addCombatantsFromModal,
    addAllCampaignCharacters: roster.addAllCampaignCharacters,
    duplicateCombatant: roster.duplicateCombatant,
    removeCombatant: roster.removeCombatant,
    updateCombatant: roster.updateCombatant,
    addCondition: roster.addCondition,
    removeCondition: roster.removeCondition,
    updateConditionLevel: roster.updateConditionLevel,
    updateAP: roster.updateAP,
    startCombat: round.startCombat,
    nextTurn: round.nextTurn,
    previousTurn: round.previousTurn,
    endCombat: round.endCombat,
    markCompleted: round.markCompleted,
    resetEncounter: round.resetEncounter,
    sortInitiative: round.sortInitiative,
  };
}
