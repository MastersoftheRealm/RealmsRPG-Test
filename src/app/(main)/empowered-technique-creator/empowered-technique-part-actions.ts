/**
 * Empowered Technique Creator — part add/update handlers (TASK-610)
 */

'use client';

import { useCallback, type Dispatch, type SetStateAction } from 'react';
import type { PowerPart, TechniquePart } from '@/hooks';
import { DURATION_VALUES } from '@/lib/game/creator-constants';
import type { DurationConfig } from '@/lib/calculators';
import type { SelectedPowerPart, SelectedTechniquePart } from './empowered-technique-bootstrap';

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
    if (nonMechanicPowerParts.length === 0) return;
    const first = nonMechanicPowerParts[0];
    if (!first) return;
    setSelectedPowerParts((previous) => [
      ...previous,
      {
        part: first,
        op_1_lvl: 0,
        op_2_lvl: 0,
        op_3_lvl: 0,
        applyDuration: false,
        selectedCategory: 'any',
      },
    ]);
  }, [nonMechanicPowerParts, setSelectedPowerParts]);

  const addPowerMechanicPart = useCallback(() => {
    if (powerMechanicsForList.length === 0) return;
    const first = powerMechanicsForList[0];
    if (!first) return;
    setSelectedPowerAdvancedParts((previous) => [
      ...previous,
      {
        part: first,
        op_1_lvl: 0,
        op_2_lvl: 0,
        op_3_lvl: 0,
        applyDuration: false,
        selectedCategory: 'any',
      },
    ]);
  }, [powerMechanicsForList, setSelectedPowerAdvancedParts]);

  const addTechniquePart = useCallback(() => {
    if (nonMechanicTechniqueParts.length === 0) return;
    const first = nonMechanicTechniqueParts[0];
    if (!first) return;
    setSelectedTechniqueParts((previous) => [
      ...previous,
      {
        part: first,
        op_1_lvl: 0,
        op_2_lvl: 0,
        op_3_lvl: 0,
        selectedCategory: 'any',
      },
    ]);
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
        focus: nextType === 'instant' ? false : previous.focus,
        noHarm: nextType === 'instant' ? false : previous.noHarm,
        endsOnActivation: nextType === 'instant' ? false : previous.endsOnActivation,
        sustain: nextType === 'instant' ? 0 : previous.sustain,
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
