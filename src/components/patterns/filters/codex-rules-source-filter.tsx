'use client';

import { ChipSelect } from './chip-select';
import { useCodexSourceCatalog } from '@/hooks/use-codex-source-catalog';
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
  const { options, isLoading, isError } = useCodexSourceCatalog();
  const placeholder = isLoading
    ? 'Loading sources…'
    : isError
      ? 'Sources unavailable'
      : CODEX_SOURCE_PICKER_PLACEHOLDER;

  return (
    <div className={className ? `min-w-0 ${className}` : 'min-w-0'}>
      <ChipSelect
        label={CODEX_SOURCE_PICKER_LABEL}
        placeholder={placeholder}
        options={options}
        selectedValues={[...selectedValues]}
        onSelect={(name) => {
          if (!selectedValues.includes(name)) onChange([...selectedValues, name]);
        }}
        onRemove={(name) => onChange(selectedValues.filter((value) => value !== name))}
      />
      {isError ? (
        <p className="mt-1 text-sm text-danger-fg" role="alert">
          Sources could not be loaded.
        </p>
      ) : null}
    </div>
  );
}
