'use client';

import { ChipSelect } from '@/components/patterns/filters';
import { CODEX_SOURCES, codexSourcesOrCore, type CodexSourceId } from '@/lib/codex/sources';

const DEFAULT_HINT = 'An item can belong to more than one source. At least one is required.';

const SOURCE_OPTIONS = CODEX_SOURCES.map((source) => ({
  value: source.id,
  label: source.label,
}));

export function AdminCodexSourceField({
  value,
  onChange,
  hint = DEFAULT_HINT,
}: {
  value: readonly string[];
  onChange: (next: CodexSourceId[]) => void;
  hint?: string;
}) {
  const selected = codexSourcesOrCore(value);

  return (
    <div className="min-w-0">
      <ChipSelect
        label="Sources"
        placeholder="Add a source"
        options={SOURCE_OPTIONS}
        selectedValues={[...selected]}
        onSelect={(id) => onChange(codexSourcesOrCore([...selected, id]))}
        onRemove={
          selected.length > 1
            ? (id) => onChange(selected.filter((source) => source !== id))
            : undefined
        }
      />
      <p className="mt-1 text-xs text-text-muted">{hint}</p>
    </div>
  );
}
