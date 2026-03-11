/**
 * Crafting Item Select Modal
 * ==========================
 * Select a single item to craft: Armaments (weapon/shield/armor) or Equipment.
 * Tabs: Armaments | Equipment. Source: All / Realms Library / My Library.
 * Reuses UnifiedSelectionModal, SourceFilter, and item-calc for market price.
 */

'use client';

import { useMemo, useState } from 'react';
import { useUserItems, useEquipment, useItemProperties, usePublicLibrary } from '@/hooks';
import { SourceFilter, type SourceFilterValue } from '@/components/shared/filters/source-filter';
import { UnifiedSelectionModal, type SelectableItem } from '@/components/shared/unified-selection-modal';
import { TabNavigation } from '@/components/ui/tab-navigation';
import {
  getCodexEquipmentMarketPrice,
  getLibraryItemMarketPrice,
  type CodexEquipmentLike,
  type LibraryItemLike,
} from '@/components/crafting/get-crafting-market-price';
import type { UserItem } from '@/hooks/use-user-library';
import type { ItemProperty } from '@/hooks/use-rtdb';

export type CraftingSelectedItem = {
  source: 'library' | 'codex' | 'public';
  id: string;
  name: string;
  marketPrice: number;
};

type CraftingTabId = 'armaments' | 'equipment';

interface CraftingItemSelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (item: CraftingSelectedItem) => void;
}

function isArmament(type: string | undefined): boolean {
  const t = (type || '').toLowerCase();
  return t === 'weapon' || t === 'shield' || t === 'armor';
}

function isEquipmentType(type: string | undefined): boolean {
  return (type || 'equipment').toLowerCase() === 'equipment';
}

export function CraftingItemSelectModal({ isOpen, onClose, onSelect }: CraftingItemSelectModalProps) {
  const [activeTab, setActiveTab] = useState<CraftingTabId>('armaments');
  const [source, setSource] = useState<SourceFilterValue>('all');

  const { data: userItems = [], isLoading: userLoading } = useUserItems();
  const { data: codexEquipment = [], isLoading: codexLoading } = useEquipment();
  const { data: itemProperties = [] } = useItemProperties();
  const { data: publicItems = [], isLoading: publicLoading } = usePublicLibrary('items');

  const propertiesDb = itemProperties as ItemProperty[];

  const armamentsItems = useMemo((): SelectableItem[] => {
    const list: SelectableItem[] = [];
    const addUser = (i: UserItem & { _source?: 'my' | 'public' }) => {
      const marketPrice = getLibraryItemMarketPrice(i, propertiesDb);
      list.push({
        id: String(i.id ?? i.docId ?? ''),
        name: String(i.name ?? ''),
        description: String(i.description ?? ''),
        columns: [{ key: 'Currency', value: marketPrice }],
        data: {
          source: (i._source ?? 'my') as 'library' | 'public',
          id: String(i.id ?? i.docId ?? ''),
          name: String(i.name ?? ''),
          marketPrice,
        } as CraftingSelectedItem,
      });
    };
    const addPublic = (i: Record<string, unknown>) => {
      const id = String(i.id ?? i.docId ?? '');
      const lib: LibraryItemLike = {
        id,
        name: String(i.name ?? ''),
        description: String(i.description ?? ''),
        type: String(i.type ?? ''),
        armamentType: String(i.armamentType ?? i.type ?? ''),
        properties: (Array.isArray(i.properties) ? i.properties : []) as LibraryItemLike['properties'],
        damage: i.damage,
      };
      const marketPrice = getLibraryItemMarketPrice(lib, propertiesDb);
      list.push({
        id,
        name: String(i.name ?? ''),
        description: String(i.description ?? ''),
        columns: [{ key: 'Currency', value: marketPrice }],
        data: {
          source: 'public',
          id,
          name: String(i.name ?? ''),
          marketPrice,
        } as CraftingSelectedItem,
      });
    };
    userItems
      .filter((i: UserItem) => isArmament(i.type as string))
      .forEach((i: UserItem) => addUser({ ...i, _source: 'my' }));
    (publicItems as Record<string, unknown>[]).filter((i: Record<string, unknown>) => isArmament(String(i.type ?? ''))).forEach(addPublic);
    return list;
  }, [userItems, publicItems, propertiesDb]);

  const equipmentItems = useMemo((): SelectableItem[] => {
    const list: SelectableItem[] = [];
    codexEquipment.forEach((e: CodexEquipmentLike) => {
      const marketPrice = getCodexEquipmentMarketPrice(e);
      list.push({
        id: String(e.id),
        name: String(e.name ?? ''),
        description: String((e as { description?: string }).description ?? ''),
        columns: [{ key: 'Currency', value: marketPrice }],
        data: {
          source: 'public',
          id: String(e.id),
          name: String(e.name ?? ''),
          marketPrice,
        } as CraftingSelectedItem,
      });
    });
    userItems
      .filter((i: UserItem) => isEquipmentType(i.type as string))
      .forEach((i: UserItem) => {
        const marketPrice = getLibraryItemMarketPrice(i as unknown as LibraryItemLike, propertiesDb);
        list.push({
          id: String(i.id ?? i.docId ?? ''),
          name: String(i.name ?? ''),
          description: String(i.description ?? ''),
          columns: [{ key: 'Currency', value: marketPrice }],
          data: {
            source: 'library',
            id: String(i.id ?? i.docId ?? ''),
            name: String(i.name ?? ''),
            marketPrice,
          } as CraftingSelectedItem,
        });
      });
    (publicItems as Record<string, unknown>[]).filter((i: Record<string, unknown>) => isEquipmentType(String(i.type ?? 'equipment'))).forEach((i: Record<string, unknown>) => {
      const id = String(i.id ?? i.docId ?? '');
      const lib: LibraryItemLike = {
        id,
        name: String(i.name ?? ''),
        description: String(i.description ?? ''),
        type: 'equipment',
        properties: (Array.isArray(i.properties) ? i.properties : []) as LibraryItemLike['properties'],
      };
      const marketPrice = getLibraryItemMarketPrice(lib, propertiesDb);
      list.push({
        id,
        name: String(i.name ?? ''),
        description: String(i.description ?? ''),
        columns: [{ key: 'Currency', value: marketPrice }],
        data: {
          source: 'public',
          id,
          name: String(i.name ?? ''),
          marketPrice,
        } as CraftingSelectedItem,
      });
    });
    return list;
  }, [codexEquipment, userItems, publicItems, propertiesDb]);

  const items = activeTab === 'armaments' ? armamentsItems : equipmentItems;
  const displayFilter = useMemo(
    () => (item: SelectableItem) => {
      const d = item.data as CraftingSelectedItem | undefined;
      if (!d) return true;
      if (source === 'all') return true;
      if (source === 'my') return d.source === 'library';
      return d.source === 'public';
    },
    [source]
  );
  const isLoading = userLoading || codexLoading || publicLoading;

  const handleConfirm = (selected: SelectableItem[]) => {
    const one = selected[0];
    if (one?.data && typeof one.data === 'object' && 'marketPrice' in one.data) {
      onSelect(one.data as CraftingSelectedItem);
    }
    onClose();
  };

  return (
    <UnifiedSelectionModal
      isOpen={isOpen}
      onClose={onClose}
      title="Select item to craft"
      description="Choose Armaments or Equipment, then pick a source. Select one item and confirm."
      headerExtra={
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <TabNavigation
            tabs={[{ id: 'armaments', label: 'Armaments' }, { id: 'equipment', label: 'Equipment' }]}
            activeTab={activeTab}
            onTabChange={(id) => setActiveTab(id as CraftingTabId)}
            variant="pill"
            fullWidth
            className="w-full sm:w-auto"
          />
          <SourceFilter value={source} onChange={setSource} />
        </div>
      }
      items={items}
      isLoading={isLoading}
      onConfirm={handleConfirm}
      maxSelections={1}
      displayFilter={displayFilter}
      columns={[{ key: 'name', label: 'Name' }, { key: 'Currency', label: 'Currency', sortable: true }]}
      gridColumns="1.4fr 0.8fr"
      itemLabel="item"
      emptyMessage={activeTab === 'armaments' ? 'No armaments found' : 'No equipment found'}
      emptySubMessage={source !== 'all' ? 'Try another source or create items in the Item Creator.' : undefined}
      searchPlaceholder="Search items..."
      size="lg"
      className="h-[70vh]"
    />
  );
}

export default CraftingItemSelectModal;
