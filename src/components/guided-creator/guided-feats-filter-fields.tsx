/**
 * Guided feats filter fields — mirrors the Codex Feats browse tab's non-requirement
 * filters (Category, State Feats) so the guided L2 modal and L3 inline catalog share
 * identical filter chrome (TASK-684). Character/level/ability requirement filters and
 * the Archetype/Character Feat Type filter are intentionally omitted — eligibility is
 * automatic per row here, and each guided step already scopes to one feat type.
 */

'use client';

import { ChipSelect, SelectFilter } from '@/components/shared/filters';
import type { StateFeatFilterMode } from '@/lib/guided-creator/feats-l2';

export interface GuidedFeatsFilterFieldsProps {
  categories: string[];
  selectedCategories: string[];
  onAddCategory: (value: string) => void;
  onRemoveCategory: (value: string) => void;
  stateFeatMode: StateFeatFilterMode;
  onStateFeatModeChange: (value: StateFeatFilterMode) => void;
}

export function GuidedFeatsFilterFields({
  categories,
  selectedCategories,
  onAddCategory,
  onRemoveCategory,
  stateFeatMode,
  onStateFeatModeChange,
}: GuidedFeatsFilterFieldsProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
        value={stateFeatMode}
        options={[
          { value: 'all', label: 'All Feats' },
          { value: 'only', label: 'Only State Feats' },
          { value: 'hide', label: 'Hide State Feats' },
        ]}
        onChange={(v) => onStateFeatModeChange(v as StateFeatFilterMode)}
        placeholder={null}
      />
    </div>
  );
}
