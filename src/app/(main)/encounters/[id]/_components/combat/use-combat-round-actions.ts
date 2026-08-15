/**
 * Combat round / turn lifecycle actions (TASK-666a)
 * =================================================
 */

'use client';

import type { Combatant, Encounter } from '@/types/encounter';
import { orderCombatantsByInitiative } from './combat-encounter-helpers';

type SetEncounter = React.Dispatch<React.SetStateAction<Encounter | null>>;

export function useCombatRoundActions({
  setEncounter,
  sortedCombatants,
}: {
  setEncounter: SetEncounter;
  sortedCombatants: Combatant[];
}) {
  const startCombat = () => {
    if (sortedCombatants.length === 0) return;
    setEncounter((prev) =>
      prev
        ? {
            ...prev,
            round: 1,
            currentTurnIndex: 0,
            isActive: true,
            status: 'active',
          }
        : prev,
    );
  };

  const nextTurn = () => {
    setEncounter((prev) => {
      if (!prev) return prev;
      const nextIndex = prev.currentTurnIndex + 1;
      if (nextIndex >= sortedCombatants.length) {
        const autoSort = prev.autoSortInitiative !== false;
        if (autoSort) {
          return {
            ...prev,
            combatants: orderCombatantsByInitiative(prev.combatants),
            round: prev.round + 1,
            currentTurnIndex: 0,
          };
        }
        return { ...prev, round: prev.round + 1, currentTurnIndex: 0 };
      }
      return { ...prev, currentTurnIndex: nextIndex };
    });
  };

  const previousTurn = () => {
    setEncounter((prev) => {
      if (!prev) return prev;
      if (prev.currentTurnIndex === 0 && prev.round === 1) return prev;
      if (prev.currentTurnIndex === 0) {
        return {
          ...prev,
          round: prev.round - 1,
          currentTurnIndex: sortedCombatants.length - 1,
        };
      }
      return { ...prev, currentTurnIndex: prev.currentTurnIndex - 1 };
    });
  };

  const endCombat = () => {
    setEncounter((prev) =>
      prev
        ? {
            ...prev,
            round: 0,
            currentTurnIndex: -1,
            isActive: false,
            status: 'paused',
          }
        : prev,
    );
  };

  const markCompleted = () => {
    setEncounter((prev) =>
      prev
        ? {
            ...prev,
            round: prev.round > 0 ? prev.round : 0,
            currentTurnIndex: -1,
            isActive: false,
            status: 'completed',
          }
        : prev,
    );
  };

  const resetEncounter = () => {
    setEncounter((prev) =>
      prev
        ? {
            ...prev,
            combatants: prev.combatants.map((c) => ({
              ...c,
              currentHealth: c.maxHealth,
              currentEnergy: c.maxEnergy,
              ap: 4,
              conditions: [],
              isSurprised: false,
            })),
            round: 0,
            currentTurnIndex: -1,
            isActive: false,
            status: 'preparing' as const,
          }
        : prev,
    );
  };

  const sortInitiative = () => {
    setEncounter((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        combatants: orderCombatantsByInitiative(prev.combatants),
      };
    });
  };

  return {
    startCombat,
    nextTurn,
    previousTurn,
    endCombat,
    markCompleted,
    resetEncounter,
    sortInitiative,
  };
}
