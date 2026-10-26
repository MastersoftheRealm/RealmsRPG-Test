/**
 * Power Creator — part add/update handlers (TASK-616)
 */

'use client';

import { useCallback, type Dispatch, type SetStateAction } from 'react';
import type { PowerPart } from '@/hooks';
import type { SelectedPart, AdvancedPart } from './power-creator-types';

/** First mechanic list entry not already in Power Mechanics (86e3jwt68). */
export function nextMechanicPartToAdd(
  mechanicPartsForList: PowerPart[],
  selectedAdvancedParts: AdvancedPart[],
): PowerPart | undefined {
  const selectedIds = new Set(selectedAdvancedParts.map((ap) => String(ap.part.id)));
  return mechanicPartsForList.find((p) => !selectedIds.has(String(p.id)));
}

type UsePowerCreatorPartActionsArgs = {
  nonMechanicParts: PowerPart[];
  mechanicPartsForList: PowerPart[];
  selectedAdvancedParts: AdvancedPart[];
  setSelectedParts: Dispatch<SetStateAction<SelectedPart[]>>;
  setSelectedAdvancedParts: Dispatch<SetStateAction<AdvancedPart[]>>;
};

export function usePowerCreatorPartActions({
  nonMechanicParts,
  mechanicPartsForList,
  selectedAdvancedParts,
  setSelectedParts,
  setSelectedAdvancedParts,
}: UsePowerCreatorPartActionsArgs) {
  const addPart = useCallback(() => {
    if (nonMechanicParts.length === 0) return;
    const first = nonMechanicParts[0];
    if (!first) return;
    setSelectedParts((prev) => [
      ...prev,
      {
        part: first,
        op_1_lvl: 0,
        op_2_lvl: 0,
        op_3_lvl: 0,
        applyDuration: false,
        selectedCategory: 'any',
      },
    ]);
  }, [nonMechanicParts, setSelectedParts]);

  const removePart = useCallback(
    (index: number) => {
      setSelectedParts((prev) => prev.filter((_, i) => i !== index));
    },
    [setSelectedParts],
  );

  const updatePart = useCallback(
    (index: number, updates: Partial<SelectedPart>) => {
      setSelectedParts((prev) => prev.map((sp, i) => (i === index ? { ...sp, ...updates } : sp)));
    },
    [setSelectedParts],
  );

  const addMechanicPart = useCallback(() => {
    const next = nextMechanicPartToAdd(mechanicPartsForList, selectedAdvancedParts);
    if (!next) return;
    setSelectedAdvancedParts((prev) => [
      ...prev,
      {
        part: next,
        op_1_lvl: 0,
        op_2_lvl: 0,
        op_3_lvl: 0,
        applyDuration: false,
        selectedCategory: 'any',
      },
    ]);
  }, [mechanicPartsForList, selectedAdvancedParts, setSelectedAdvancedParts]);

  const removeAdvancedPart = useCallback(
    (index: number) => {
      setSelectedAdvancedParts((prev) => prev.filter((_, i) => i !== index));
    },
    [setSelectedAdvancedParts],
  );

  const updateAdvancedPart = useCallback(
    (index: number, updates: Partial<AdvancedPart>) => {
      setSelectedAdvancedParts((prev) =>
        prev.map((ap, i) => (i === index ? { ...ap, ...updates } : ap)),
      );
    },
    [setSelectedAdvancedParts],
  );

  return {
    addPart,
    removePart,
    updatePart,
    addMechanicPart,
    removeAdvancedPart,
    updateAdvancedPart,
  };
}
