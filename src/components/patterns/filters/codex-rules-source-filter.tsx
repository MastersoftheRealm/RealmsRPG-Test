'use client';

import { ChipSelect } from './chip-select';
import { useCodexSourceCatalogOptions } from '@/hooks/use-codex-source-catalog';
import { CODEX_SOURCE_PICKER_LABEL, CODEX_SOURCE_PICKER_PLACEHOLDER } from '@/lib/codex/sources';

export interface CodexRulesSourceFilterProps {
  selectedValues: string[];
  onChange: (next: string[]) => void;
  className?: string | undefined;
}

/** Multi-select rules-source filter from the codex catalog. Empty selection = All. */
export function CodexRulesSourceFilter({
  selectedValues,
  onChange,
  className,
}: CodexRulesSourceFilterProps) {
  const options = useCodexSourceCatalogOptions();

  return (
    <ChipSelect
      label={CODEX_SOURCE_PICKER_LABEL}
      placeholder={CODEX_SOURCE_PICKER_PLACEHOLDER}
      options={options}
      selectedValues={[...selectedValues]}
      onSelect={(name) => {
        if (!selectedValues.includes(name)) onChange([...selectedValues, name]);
      }}
      onRemove={(name) => onChange(selectedValues.filter((value) => value !== name))}
      className={className}
    />
  );
}
