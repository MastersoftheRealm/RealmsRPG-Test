'use client';

import { ChipSelect } from './chip-select';
import { CODEX_RULES_SOURCE_FILTER_OPTIONS } from '@/lib/codex/list-rules-source-filter';
import type { CodexSourceId } from '@/lib/codex/sources';

export interface CodexRulesSourceFilterProps {
  selectedValues: CodexSourceId[];
  onSelect: (id: CodexSourceId) => void;
  onRemove: (id: CodexSourceId) => void;
  className?: string | undefined;
}

/** Multi-select rules-source filter (Core + expansions). Empty selection = All. */
export function CodexRulesSourceFilter({
  selectedValues,
  onSelect,
  onRemove,
  className,
}: CodexRulesSourceFilterProps) {
  return (
    <ChipSelect
      label="Sources"
      placeholder="Add source"
      options={CODEX_RULES_SOURCE_FILTER_OPTIONS}
      selectedValues={[...selectedValues]}
      onSelect={(value) => onSelect(value as CodexSourceId)}
      onRemove={(value) => onRemove(value as CodexSourceId)}
      className={className}
    />
  );
}
