/**
 * Empowered Technique Creator — part add/update handlers (TASK-610)
 */

'use client';

import { useCallback, type Dispatch, type SetStateAction } from 'react';
import type { PowerPart, TechniquePart } from '@/hooks';
import { DURATION_VALUES } from '@/lib/game/creator-constants';
import type { DurationConfig } from '@/lib/calculators';
import type { SelectedPowerPart, SelectedTechniquePart } from './empowered-technique-bootstrap';
import {
  emptyPowerPartSelection,
  emptyTechniquePartSelection,
  nextPowerPartToAdd,
  nextTechniquePartToAdd,
} from '@/lib/game/creator-part-add';

type UseEmpoweredTechniquePartActionsArgs = {
  nonMechanicPowerParts: PowerPart[];
  powerMechanicsForList: PowerPart[];
  nonMechanicTechniqueParts: TechniquePart[];
  setSelectedPowerParts: Dispatch<SetStateAction<SelectedPowerPart[]>>;
  setSelectedPowerAdvancedParts: Dispatch<SetStateAction<SelectedPowerPart[]>>;
  setSelectedTechniqueParts: Dispatch<SetStateAction<SelectedTechniquePart[]>>;
  setDuration: Dispatch<SetStateAction<DurationConfig>>;
};

export function useEmpoweredTechniquePartActions({
  nonMechanicPowerParts,
  powerMechanicsForList,
  nonMechanicTechniqueParts,
  setSelectedPowerParts,
  setSelectedPowerAdvancedParts,
  setSelectedTechniqueParts,
  setDuration,
}: UseEmpoweredTechniquePartActionsArgs) {
  const addPowerPart = useCallback(() => {
    const first = nextPowerPartToAdd(nonMechanicPowerParts);
    if (!first) return;
    setSelectedPowerParts((previous) => [...previous, emptyPowerPartSelection(first)]);
  }, [nonMechanicPowerParts, setSelectedPowerParts]);

  const addPowerMechanicPart = useCallback(() => {
    const first = nextPowerPartToAdd(powerMechanicsForList);
    if (!first) return;
    setSelectedPowerAdvancedParts((previous) => [...previous, emptyPowerPartSelection(first)]);
  }, [powerMechanicsForList, setSelectedPowerAdvancedParts]);

  const addTechniquePart = useCallback(() => {
    const first = nextTechniquePartToAdd(nonMechanicTechniqueParts);
    if (!first) return;
    setSelectedTechniqueParts((previous) => [...previous, emptyTechniquePartSelection(first)]);
  }, [nonMechanicTechniqueParts, setSelectedTechniqueParts]);

  const updatePowerPart = useCallback(
    (index: number, updates: Partial<SelectedPowerPart>) => {
      setSelectedPowerParts((previous) =>
        previous.map((row, rowIndex) =>
          rowIndex === index
            ? {
                ...row,
                part: (updates.part as PowerPart) ?? row.part,
                op_1_lvl: updates.op_1_lvl ?? row.op_1_lvl,
                op_2_lvl: updates.op_2_lvl ?? row.op_2_lvl,
                op_3_lvl: updates.op_3_lvl ?? row.op_3_lvl,
                applyDuration: updates.applyDuration ?? row.applyDuration,
                selectedCategory: updates.selectedCategory ?? row.selectedCategory,
              }
            : row,
        ),
      );
    },
    [setSelectedPowerParts],
  );

  const updatePowerAdvancedPart = useCallback(
    (index: number, updates: Partial<SelectedPowerPart>) => {
      setSelectedPowerAdvancedParts((previous) =>
        previous.map((row, rowIndex) =>
          rowIndex === index
            ? {
                ...row,
                part: (updates.part as PowerPart) ?? row.part,
                op_1_lvl: updates.op_1_lvl ?? row.op_1_lvl,
                op_2_lvl: updates.op_2_lvl ?? row.op_2_lvl,
                op_3_lvl: updates.op_3_lvl ?? row.op_3_lvl,
                applyDuration: updates.applyDuration ?? row.applyDuration,
                selectedCategory: updates.selectedCategory ?? row.selectedCategory,
              }
            : row,
        ),
      );
    },
    [setSelectedPowerAdvancedParts],
  );

  const updateTechniquePart = useCallback(
    (index: number, updates: Partial<SelectedTechniquePart>) => {
      setSelectedTechniqueParts((previous) =>
        previous.map((row, rowIndex) =>
          rowIndex === index
            ? {
                ...row,
                part: (updates.part as TechniquePart) ?? row.part,
                op_1_lvl: updates.op_1_lvl ?? row.op_1_lvl,
                op_2_lvl: updates.op_2_lvl ?? row.op_2_lvl,
                op_3_lvl: updates.op_3_lvl ?? row.op_3_lvl,
                selectedCategory: updates.selectedCategory ?? row.selectedCategory,
              }
            : row,
        ),
      );
    },
    [setSelectedTechniqueParts],
  );

  const handleDurationTypeChange = useCallback(
    (nextType: DurationConfig['type']) => {
      const nextValue = DURATION_VALUES[nextType]?.[0]?.value || 1;
      setDuration((previous) => ({
        ...previous,
        type: nextType,
        value: nextValue,
      }));
    },
    [setDuration],
  );

  return {
    addPowerPart,
    addPowerMechanicPart,
    addTechniquePart,
    updatePowerPart,
    updatePowerAdvancedPart,
    updateTechniquePart,
    handleDurationTypeChange,
  };
}
