/**
 * Guided feats filter fields — mirrors the Codex Feats browse tab's non-requirement
 * filters (Category, State Feats, Archetype Path last) so the guided L2 modal and L3
 * inline catalog share identical filter chrome (TASK-684 / TASK-753). Character/level/
 * ability requirement filters and the Archetype/Character Feat Type filter are
 * intentionally omitted — eligibility is automatic per row here, and each guided step
 * already scopes to one feat type.
 */

'use client';

import { InfoTippy } from '@/components/patterns';
import {
  ArchetypePathFilter,
  ChipSelect,
  SelectFilter,
  type ArchetypePathFilterProps,
} from '@/components/patterns/filters';
import { STATE_FEAT_RESTRICTION_NOTICE } from '@/lib/codex/feat-restriction-notice';
import type { StateFeatFilterMode } from '@/lib/guided-creator/feats-l2';

export interface GuidedFeatsFilterFieldsProps {
  categories: string[];
  selectedCategories: string[];
  onAddCategory: (value: string) => void;
  onRemoveCategory: (value: string) => void;
  stateFeatMode: StateFeatFilterMode;
  onStateFeatModeChange: (value: StateFeatFilterMode) => void;
  pathFilter?: Pick<ArchetypePathFilterProps, 'options' | 'selectedPathIds' | 'onChange'> | null;
}

export function GuidedFeatsFilterFields({
  categories,
  selectedCategories,
  onAddCategory,
  onRemoveCategory,
  stateFeatMode,
  onStateFeatModeChange,
  pathFilter,
}: GuidedFeatsFilterFieldsProps) {
  return (
    <div className="grid grid-cols-1 items-start gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      <ChipSelect
        label="Category"
        placeholder="Choose category"
        options={categories.map((cat) => ({ value: cat, label: cat }))}
        selectedValues={selectedCategories}
        onSelect={onAddCategory}
        onRemove={onRemoveCategory}
      />
      <SelectFilter
        label="State Feats"
        labelAccessory={
          <InfoTippy content={STATE_FEAT_RESTRICTION_NOTICE} label="State Feats filter help" />
        }
        value={stateFeatMode}
        options={[
          { value: 'all', label: 'All Feats' },
          { value: 'only', label: 'Only State Feats' },
          { value: 'hide', label: 'Hide State Feats' },
        ]}
        onChange={(v) => onStateFeatModeChange(v as StateFeatFilterMode)}
        placeholder={null}
      />
      {pathFilter ? (
        <ArchetypePathFilter
          options={pathFilter.options}
          selectedPathIds={pathFilter.selectedPathIds}
          onChange={pathFilter.onChange}
        />
      ) : null}
    </div>
  );
}
