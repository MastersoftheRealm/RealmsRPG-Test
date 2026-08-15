/**
 * Combat roster actions — add / mutate / drag-reorder (TASK-666a)
 * ===============================================================
 */

'use client';

import { useCallback, useState, type DragEvent } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { Combatant, CombatantCondition, Encounter, TrackedCombatant } from '@/types/encounter';
import { CONDITION_OPTIONS } from '@/components/encounters/encounter-constants';
import { fetchCampaignCharacterForEncounter, useAuth } from '@/hooks';
import {
  isOwnedLinkedCombatant,
  scheduleCharacterResourceSyncFromCombatant,
} from '@/lib/encounter/character-resource-sync';
import type { Campaign } from '@/types/campaign';
import {
  sortCombatantsForTurnOrder,
  remapTurnIndexAfterReorder,
  createEmptyNewCombatantForm,
  buildManualCombatantsFromForm,
  buildDuplicateCombatant,
  buildCampaignCharacterCombatant,
  type NewCombatantForm,
} from './combat-encounter-helpers';

type SetEncounter = React.Dispatch<React.SetStateAction<Encounter | null>>;

export function useCombatRosterActions({
  encounter,
  setEncounter,
  campaignsFull,
}: {
  encounter: Encounter;
  setEncounter: SetEncounter;
  campaignsFull: Campaign[];
}) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showAddModal, setShowAddModal] = useState(false);
  const [addingAllChars, setAddingAllChars] = useState(false);
  const [newCombatant, setNewCombatant] = useState<NewCombatantForm>(() =>
    createEmptyNewCombatantForm(),
  );
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);

  const linkedCampaign = encounter?.campaignId
    ? campaignsFull.find((c: Campaign) => c.id === encounter.campaignId)
    : undefined;

  const handleDragStart = useCallback((e: DragEvent<HTMLDivElement>, id: string) => {
    setDraggedId(id);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', id);
  }, []);

  const handleDragEnd = useCallback(() => {
    setDraggedId(null);
    setDragOverId(null);
  }, []);

  const handleDragOver = useCallback(
    (e: DragEvent<HTMLDivElement>, id: string) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      if (id !== draggedId) setDragOverId(id);
    },
    [draggedId],
  );

  const handleDragLeave = useCallback(() => setDragOverId(null), []);

  const handleDrop = useCallback(
    (e: DragEvent<HTMLDivElement>, targetId: string) => {
      e.preventDefault();
      if (!draggedId || draggedId === targetId) {
        setDraggedId(null);
        setDragOverId(null);
        return;
      }
      setEncounter((prev) => {
        if (!prev) return prev;
        const oldSorted = sortCombatantsForTurnOrder(prev.combatants, prev.round);
        const combatants = [...prev.combatants];
        const draggedIndex = combatants.findIndex((c) => c.id === draggedId);
        const targetIndex = combatants.findIndex((c) => c.id === targetId);
        if (draggedIndex === -1 || targetIndex === -1) return prev;
        const [draggedItem] = combatants.splice(draggedIndex, 1);
        combatants.splice(targetIndex, 0, draggedItem);
        const newSorted = sortCombatantsForTurnOrder(combatants, prev.round);
        const newTurnIndex = remapTurnIndexAfterReorder(
          prev.currentTurnIndex,
          oldSorted,
          newSorted,
        );
        return { ...prev, combatants, currentTurnIndex: newTurnIndex };
      });
      setDraggedId(null);
      setDragOverId(null);
    },
    [draggedId, setEncounter],
  );

  const addCombatant = () => {
    if (!newCombatant.name.trim()) return;
    const newCombatants = buildManualCombatantsFromForm(newCombatant);
    setEncounter((prev) =>
      prev ? { ...prev, combatants: [...prev.combatants, ...newCombatants] } : prev,
    );
    setNewCombatant(createEmptyNewCombatantForm());
  };

  const addCombatantsFromModal = (combatants: TrackedCombatant[]) => {
    setEncounter((prev) =>
      prev ? { ...prev, combatants: [...prev.combatants, ...combatants] } : prev,
    );
    setShowAddModal(false);
  };

  const addAllCampaignCharacters = useCallback(async () => {
    if (!encounter?.campaignId || !linkedCampaign?.characters?.length) return;
    setAddingAllChars(true);
    try {
      const results = await Promise.all(
        linkedCampaign.characters.map(async (c) => {
          try {
            const data = await fetchCampaignCharacterForEncounter(
              queryClient,
              encounter.campaignId as string,
              user?.uid,
              c.userId,
              c.characterId,
            );
            if (!data) return null;
            return { charMeta: c, data };
          } catch {
            return null;
          }
        }),
      );
      const combatants = results
        .filter((r): r is NonNullable<typeof r> => r !== null)
        .map((r) => buildCampaignCharacterCombatant(r.charMeta, r.data));
      setEncounter((prev) =>
        prev ? { ...prev, combatants: [...prev.combatants, ...combatants] } : prev,
      );
    } catch {
      // Pre-split parity: silent outer catch (TASK-666 cleanup).
    } finally {
      setAddingAllChars(false);
    }
  }, [encounter, linkedCampaign, queryClient, setEncounter, user]);

  const duplicateCombatant = (combatant: Combatant) => {
    const existing = encounter?.combatants || [];
    const duplicate = buildDuplicateCombatant(
      combatant,
      existing.map((c) => c.name),
    );
    setEncounter((prev) =>
      prev ? { ...prev, combatants: [...prev.combatants, duplicate] } : prev,
    );
  };

  const removeCombatant = (id: string) => {
    setEncounter((prev) => {
      if (!prev) return prev;
      const combatants = prev.combatants.filter((c) => c.id !== id);
      const oldSorted = sortCombatantsForTurnOrder(prev.combatants, prev.round);
      const removedIndex = oldSorted.findIndex((c) => c.id === id);
      const newSorted = sortCombatantsForTurnOrder(combatants, prev.round);
      const newLen = newSorted.length;
      let newTurnIndex = prev.currentTurnIndex;
      if (removedIndex >= 0) {
        if (removedIndex < prev.currentTurnIndex) newTurnIndex = prev.currentTurnIndex - 1;
        else if (removedIndex === prev.currentTurnIndex)
          newTurnIndex = Math.min(prev.currentTurnIndex, Math.max(0, newLen - 1));
      }
      return { ...prev, combatants, currentTurnIndex: newTurnIndex };
    });
  };

  const updateCombatant = (id: string, updates: Partial<Combatant>) => {
    setEncounter((prev) => {
      if (!prev) return prev;
      const combatant = prev.combatants.find((c) => c.id === id) as TrackedCombatant | undefined;
      const owned = isOwnedLinkedCombatant(combatant, user?.uid);
      const isLinked = combatant?.sourceType === 'campaign-character';
      const resourceKeys = [
        'currentHealth',
        'maxHealth',
        'currentEnergy',
        'maxEnergy',
        'ap',
      ] as const;
      let applied: Partial<Combatant> = updates;
      if (isLinked && !owned) {
        applied = Object.fromEntries(
          Object.entries(updates).filter(
            ([k]) => !resourceKeys.includes(k as (typeof resourceKeys)[number]),
          ),
        ) as Partial<Combatant>;
      } else if (isLinked && owned) {
        applied = Object.fromEntries(
          Object.entries(updates).filter(([k]) => k !== 'maxHealth' && k !== 'maxEnergy'),
        ) as Partial<Combatant>;
      }
      const next = prev.combatants.map((c) => (c.id === id ? { ...c, ...applied } : c));
      const updated = next.find((c) => c.id === id) as TrackedCombatant | undefined;
      if (owned && updated && resourceKeys.some((k) => k in updates)) {
        scheduleCharacterResourceSyncFromCombatant(updated);
      }
      return { ...prev, combatants: next };
    });
  };

  const addCondition = (id: string, conditionName: string) => {
    const condDef = CONDITION_OPTIONS.find((c) => c.name === conditionName);
    const isLeveled = condDef?.leveled ?? true;
    setEncounter((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        combatants: prev.combatants.map((c) => {
          if (c.id !== id) return c;
          if (c.conditions.some((cond) => cond.name === conditionName)) return c;
          return {
            ...c,
            conditions: [...c.conditions, { name: conditionName, level: isLeveled ? 1 : 0 }],
          };
        }),
      };
    });
  };

  const removeCondition = (id: string, conditionName: string) => {
    setEncounter((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        combatants: prev.combatants.map((c) =>
          c.id !== id
            ? c
            : {
                ...c,
                conditions: c.conditions.filter((cond) => cond.name !== conditionName),
              },
        ),
      };
    });
  };

  const updateConditionLevel = (id: string, conditionName: string, delta: number) => {
    setEncounter((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        combatants: prev.combatants.map((c) => {
          if (c.id !== id) return c;
          return {
            ...c,
            conditions: c.conditions
              .map((cond) => {
                if (cond.name !== conditionName) return cond;
                const newLevel = cond.level + delta;
                if (newLevel <= 0) return null;
                return { ...cond, level: newLevel };
              })
              .filter((cond): cond is CombatantCondition => cond !== null),
          };
        }),
      };
    });
  };

  const updateAP = (id: string, delta: number) => {
    setEncounter((prev) => {
      if (!prev) return prev;
      const combatant = prev.combatants.find((c) => c.id === id) as TrackedCombatant | undefined;
      const owned = isOwnedLinkedCombatant(combatant, user?.uid);
      if (combatant?.sourceType === 'campaign-character' && !owned) return prev;
      const next = prev.combatants.map((c) =>
        c.id === id ? { ...c, ap: Math.max(0, Math.min(10, c.ap + delta)) } : c,
      );
      const updated = next.find((c) => c.id === id) as TrackedCombatant | undefined;
      if (owned && updated) {
        scheduleCharacterResourceSyncFromCombatant(updated);
      }
      return { ...prev, combatants: next };
    });
  };

  return {
    user,
    showAddModal,
    setShowAddModal,
    addingAllChars,
    newCombatant,
    setNewCombatant,
    draggedId,
    dragOverId,
    linkedCampaign,
    handleDragStart,
    handleDragEnd,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    addCombatant,
    addCombatantsFromModal,
    addAllCampaignCharacters,
    duplicateCombatant,
    removeCombatant,
    updateCombatant,
    addCondition,
    removeCondition,
    updateConditionLevel,
    updateAP,
  };
}
