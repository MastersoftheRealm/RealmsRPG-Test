import type { SourceFilterValue } from '@/components/shared/filters/source-filter';
import type { SelectableItem } from '@/components/shared/unified-selection-modal';

export type AddLibraryItemType = 'power' | 'technique' | 'weapon' | 'shield' | 'armor' | 'equipment';
export type PowerSelectionMode = 'powers' | 'empowered';

export type EqItem = {
  id: string;
  name?: string;
  description?: string;
  damage?: unknown;
  armorValue?: number;
  properties?: Array<string | { id?: string | number; name?: string; op_1_lvl?: number; base_tp?: number; op_1_tp?: number }>;
};

export type WithSource<T> = T & { _source: 'my' | 'public' };

export interface UseAddLibraryItemDataOptions {
  itemType: AddLibraryItemType;
  existingIds: Set<string>;
}

export interface UseAddLibraryItemDataReturn {
  source: SourceFilterValue;
  setSource: (value: SourceFilterValue) => void;
  powerSelectionMode: PowerSelectionMode;
  setPowerSelectionMode: (value: PowerSelectionMode) => void;
  items: SelectableItem[];
  isLoading: boolean;
  displayFilterFn: (item: SelectableItem) => boolean;
  emptyTitle: string;
  emptyDesc: string | undefined;
  dbs: CodexDbRefs;
}

export interface CodexDbRefs {
  techniquePartsDb: unknown[];
  powerPartsDb: unknown[];
  itemPropertiesDb: unknown[];
}
