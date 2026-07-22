/**
 * Item Creator — property add/update handlers (TASK-616)
 */

'use client';

import { useCallback, type Dispatch, type SetStateAction } from 'react';
import type { ItemProperty } from '@/hooks';
import { isGeneralProperty, isMechanicProperty } from '@/lib/calculators';
import type { ArmamentType, ItemSelectedProperty as SelectedProperty } from './item-creator-bootstrap';

type UseItemCreatorPropertyActionsArgs = {
  itemProperties: ItemProperty[];
  armamentType: ArmamentType;
  selectedProperties: SelectedProperty[];
  setSelectedProperties: Dispatch<SetStateAction<SelectedProperty[]>>;
};

export function useItemCreatorPropertyActions({
  itemProperties,
  armamentType,
  selectedProperties,
  setSelectedProperties,
}: UseItemCreatorPropertyActionsArgs) {
  const addProperty = useCallback(() => {
    const armamentTypeLower = armamentType.toLowerCase();
    const selectableProps = itemProperties.filter((p: ItemProperty) => {
      if (isGeneralProperty(p)) return false;
      if (isMechanicProperty(p)) return false;
      const propType = (p.type || '').toLowerCase();
      if (!propType || propType === 'general') return true;
      return propType === armamentTypeLower;
    });
    if (selectableProps.length === 0) return;

    const available =
      selectableProps.find(
        (p: ItemProperty) => !selectedProperties.some((sp: SelectedProperty) => sp.property.id === p.id),
      ) || selectableProps[0];

    setSelectedProperties((prev) => [
      ...prev,
      {
        property: available,
        op_1_lvl: 0,
      },
    ]);
  }, [itemProperties, selectedProperties, armamentType, setSelectedProperties]);

  const removeProperty = useCallback(
    (index: number) => {
      setSelectedProperties((prev) => prev.filter((_, i) => i !== index));
    },
    [setSelectedProperties],
  );

  const updateProperty = useCallback(
    (index: number, updates: Partial<SelectedProperty>) => {
      setSelectedProperties((prev) => prev.map((sp, i) => (i === index ? { ...sp, ...updates } : sp)));
    },
    [setSelectedProperties],
  );

  return {
    addProperty,
    removeProperty,
    updateProperty,
  };
}
