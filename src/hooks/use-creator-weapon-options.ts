'use client';

import { useMemo } from 'react';
import type { UserItem } from '@/hooks/use-user-library';
import type { ItemPropertyTpRow } from '@/lib/calculators/item-calc';
import type { SourceFilterValue } from '@/components/shared/filters/source-filter';
import {
  buildCreatorWeaponOptions,
  filterCreatorWeaponOptionsBySource,
  type CreatorWeaponOption,
} from '@/lib/creator-weapon-options';

export function useCreatorWeaponOptions(params: {
  defaults: Array<{ id: string | number; name: string; tp?: number }>;
  userItems: UserItem[];
  officialWeaponItems: Record<string, unknown>[] | undefined;
  itemPropertiesDb: ItemPropertyTpRow[];
  librarySource: SourceFilterValue;
}): { fullOptions: CreatorWeaponOption[]; visibleOptions: CreatorWeaponOption[] } {
  const { defaults, userItems, officialWeaponItems, itemPropertiesDb, librarySource } = params;

  const fullOptions = useMemo(
    () =>
      buildCreatorWeaponOptions({
        defaults,
        userItems,
        officialWeaponRows: officialWeaponItems,
        itemPropertiesDb,
      }),
    [defaults, userItems, officialWeaponItems, itemPropertiesDb],
  );

  const visibleOptions = useMemo(
    () => filterCreatorWeaponOptionsBySource(fullOptions, librarySource),
    [fullOptions, librarySource],
  );

  return { fullOptions, visibleOptions };
}
