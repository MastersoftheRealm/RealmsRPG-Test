import type { SourceFilterValue } from '@/components/shared/filters/source-filter';
import type { SelectableItem } from '@/components/shared/unified-selection-modal';
import type { EqItem as SharedEqItem } from '@/lib/library-selectable-builders';

export type AddLibraryItemType = 'power' | 'technique' | 'weapon' | 'shield' | 'armor' | 'equipment';
export type PowerSelectionMode = 'powers' | 'empowered';

/** Shared with load modal builders — see `@/lib/library-selectable-builders`. */
export type EqItem = SharedEqItem;

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
