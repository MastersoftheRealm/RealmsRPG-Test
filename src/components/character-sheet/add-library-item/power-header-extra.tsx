'use client';

import { SourceFilter } from '@/components/patterns/filters/source-filter';
import { SegmentedControl } from '@/components/patterns';
import type { PowerSelectionMode } from '@/hooks/add-library-item/types';
import type { SourceFilterValue } from '@/components/patterns/filters/source-filter';

/** Primary mode tabs — pass as UnifiedSelectionModal `scopeExtra` (always visible). */
export function AddLibraryItemScopeExtra({
  itemType,
  powerSelectionMode,
  onPowerSelectionModeChange,
}: {
  itemType: string;
  powerSelectionMode: PowerSelectionMode;
  onPowerSelectionModeChange: (value: PowerSelectionMode) => void;
}) {
  if (itemType !== 'power') return null;
  return (
    <SegmentedControl<PowerSelectionMode>
      value={powerSelectionMode}
      onChange={onPowerSelectionModeChange}
      aria-label="Power selection type"
      tabs
      options={[
        { value: 'powers', label: 'Powers' },
        { value: 'empowered', label: 'Empowered Techniques' },
      ]}
    />
  );
}

/** Secondary chrome — pass as `headerExtra` (collapsed under Filters). */
export function AddLibraryItemHeaderExtra({
  source,
  onSourceChange,
}: {
  source: SourceFilterValue;
  onSourceChange: (value: SourceFilterValue) => void;
}) {
  return <SourceFilter value={source} onChange={onSourceChange} />;
}
