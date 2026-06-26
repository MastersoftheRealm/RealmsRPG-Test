'use client';

import { useMemo, useState } from 'react';
import { useUserPowers, useUserTechniques, useUserEmpoweredTechniques, useUserItems } from '../use-user-library';
import {
  useCodexEquipment,
  useCodexTechniqueParts,
  useCodexPowerParts,
  useCodexItemProperties,
} from '../use-codex';
import { useOfficialLibrary } from '../use-official-library';
import type { SourceFilterValue } from '@/components/shared/filters/source-filter';
import type { SelectableItem } from '@/components/shared/unified-selection-modal';
import type { UserItem, UserPower, UserTechnique } from '../use-user-library';
import { buildSelectableItem } from './build-selectable-item';
import { loadEmpoweredRawItems, loadRawItemsForType } from './load-raw-items';
import type {
  EqItem,
  PowerSelectionMode,
  UseAddLibraryItemDataOptions,
  UseAddLibraryItemDataReturn,
} from './types';

export function useAddLibraryItemData({
  itemType,
  existingIds,
}: UseAddLibraryItemDataOptions): UseAddLibraryItemDataReturn {
  const [source, setSource] = useState<SourceFilterValue>('all');
  const [powerSelectionMode, setPowerSelectionMode] = useState<PowerSelectionMode>('powers');

  const { data: userPowers = [], isLoading: powersLoading } = useUserPowers();
  const { data: userTechniques = [], isLoading: techniquesLoading } = useUserTechniques();
  const { data: userEmpoweredTechniques = [], isLoading: empoweredTechniquesLoading } = useUserEmpoweredTechniques();
  const { data: userItems = [], isLoading: itemsLoading } = useUserItems();
  const { data: codexEquipment = [], isLoading: equipmentLoading } = useCodexEquipment();
  const { data: techniquePartsDb = [] } = useCodexTechniqueParts();
  const { data: powerPartsDb = [] } = useCodexPowerParts();
  const { data: itemPropertiesDb = [] } = useCodexItemProperties();
  const { data: publicPowers = [], isLoading: publicPowersLoading, isError: publicPowersError } = useOfficialLibrary('powers');
  const { data: publicTechniques = [], isLoading: publicTechniquesLoading, isError: publicTechniquesError } = useOfficialLibrary('techniques');
  const { data: publicEmpoweredTechniques = [], isLoading: publicEmpoweredTechniquesLoading, isError: publicEmpoweredTechniquesError } = useOfficialLibrary('empowered-techniques');
  const { data: publicItems = [], isLoading: publicItemsLoading, isError: publicItemsError } = useOfficialLibrary('items');
  const publicLibraryError = publicPowersError || publicTechniquesError || publicEmpoweredTechniquesError || publicItemsError;

  const dbs = useMemo(
    () => ({ techniquePartsDb, powerPartsDb, itemPropertiesDb }),
    [techniquePartsDb, powerPartsDb, itemPropertiesDb]
  );

  const { rawItems, isLoading: rawItemsLoading } = useMemo(
    () =>
      loadRawItemsForType({
        itemType,
        userPowers: userPowers as UserPower[],
        userTechniques: userTechniques as UserTechnique[],
        userItems: userItems as UserItem[],
        codexEquipment: codexEquipment as Parameters<typeof loadRawItemsForType>[0]['codexEquipment'],
        publicPowers: publicPowers as Record<string, unknown>[],
        publicTechniques: publicTechniques as Record<string, unknown>[],
        publicItems: publicItems as Record<string, unknown>[],
        loading: {
          powersLoading,
          techniquesLoading,
          itemsLoading,
          equipmentLoading,
          publicPowersLoading,
          publicTechniquesLoading,
          publicItemsLoading,
        },
      }),
    [
      itemType,
      userPowers,
      userTechniques,
      userItems,
      codexEquipment,
      publicPowers,
      publicTechniques,
      publicItems,
      powersLoading,
      techniquesLoading,
      itemsLoading,
      equipmentLoading,
      publicPowersLoading,
      publicTechniquesLoading,
      publicItemsLoading,
    ]
  );

  const empoweredRawItems = useMemo(() => {
    if (itemType !== 'power') return [];
    return loadEmpoweredRawItems({
      userEmpoweredTechniques: userEmpoweredTechniques as UserTechnique[],
      publicEmpoweredTechniques: publicEmpoweredTechniques as Record<string, unknown>[],
    });
  }, [itemType, publicEmpoweredTechniques, userEmpoweredTechniques]);

  const items: SelectableItem[] = useMemo(() => {
    const list = itemType === 'power' && powerSelectionMode === 'empowered' ? empoweredRawItems : rawItems;
    return list
      .filter((item) => !existingIds.has(String((item as { id?: string | number }).id ?? '')))
      .map((item) =>
        buildSelectableItem(
          item as UserPower | UserTechnique | UserItem | EqItem,
          itemType,
          powerSelectionMode,
          dbs
        )
      );
  }, [rawItems, empoweredRawItems, existingIds, itemType, powerSelectionMode, dbs]);

  const isLoading =
    itemType === 'power' && powerSelectionMode === 'empowered'
      ? empoweredTechniquesLoading || publicEmpoweredTechniquesLoading
      : rawItemsLoading;

  const typeLabel =
    itemType === 'power'
      ? 'Powers'
      : itemType === 'technique'
        ? 'Techniques'
        : itemType === 'weapon'
          ? 'Weapons'
          : itemType === 'shield'
            ? 'Shields'
            : itemType === 'armor'
              ? 'Armor'
              : 'Equipment';

  const displayFilterFn = useMemo(
    () => (item: SelectableItem) =>
      source === 'all' || (item.data as { _source?: 'my' | 'public' })?._source === source,
    [source]
  );

  const displayedCount = useMemo(() => items.filter(displayFilterFn).length, [items, displayFilterFn]);

  const emptyTitle =
    displayedCount === 0
      ? source === 'public'
        ? `No public ${typeLabel.toLowerCase()} in the community library`
        : `No ${itemType}s available`
      : 'All already added or no matches';

  const emptyDesc =
    displayedCount === 0
      ? source === 'public' && publicLibraryError
        ? 'Failed to load Realms Library. Try again later.'
        : source === 'public'
          ? 'Official content can be added by admins via Admin → Realms Library Editor.'
          : itemType === 'equipment'
            ? 'Equipment is loaded from the Codex. Add equipment via the Admin Codex if needed.'
            : `Create some in the ${itemType === 'power' ? 'Power' : itemType === 'technique' ? 'Technique' : 'Item'} Creator first!`
      : undefined;

  return {
    source,
    setSource,
    powerSelectionMode,
    setPowerSelectionMode,
    items,
    isLoading,
    displayFilterFn,
    emptyTitle,
    emptyDesc,
    dbs,
  };
}

export type {
  AddLibraryItemType,
  EqItem,
  PowerSelectionMode,
  UseAddLibraryItemDataOptions,
  UseAddLibraryItemDataReturn,
} from './types';
