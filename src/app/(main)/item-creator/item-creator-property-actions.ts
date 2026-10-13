/**
 * Item Creator — property add/update handlers (TASK-616)
 */

'use client';

import { useCallback, type Dispatch, type SetStateAction } from 'react';
import type { ItemProperty } from '@/hooks';
import type {
  ArmamentType,
  ItemSelectedProperty as SelectedProperty,
} from './item-creator-bootstrap';
import { findAddableItemProperty } from './item-creator-property-options';

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
    const available = findAddableItemProperty(
      itemProperties,
      armamentType,
      selectedProperties.map((sp) => sp.property.id),
    );
    if (!available) return;

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
      setSelectedProperties((prev) =>
        prev.map((sp, i) => (i === index ? { ...sp, ...updates } : sp)),
      );
    },
    [setSelectedProperties],
  );

  return {
    addProperty,
    removeProperty,
    updateProperty,
  };
}
