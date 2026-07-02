'use client';

import { SourceFilter } from '@/components/shared/filters/source-filter';
import { SegmentedControl } from '@/components/shared';
import type { PowerSelectionMode } from '@/hooks/add-library-item/types';
import type { SourceFilterValue } from '@/components/shared/filters/source-filter';

export function AddLibraryItemHeaderExtra({
  source,
  onSourceChange,
  itemType,
  powerSelectionMode,
  onPowerSelectionModeChange,
}: {
  source: SourceFilterValue;
  onSourceChange: (value: SourceFilterValue) => void;
  itemType: string;
  powerSelectionMode: PowerSelectionMode;
  onPowerSelectionModeChange: (value: PowerSelectionMode) => void;
}) {
  return (
    <div className="space-y-3">
      <SourceFilter value={source} onChange={onSourceChange} />
      {itemType === 'power' && (
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
      )}
    </div>
  );
}
