'use client';

import { useMemo, useState } from 'react';
import { ChipSelect } from '@/components/patterns/filters';
import { Input } from '@/components/ui';
import {
  CODEX_SOURCE_PICKER_LABEL,
  CODEX_SOURCE_PICKER_PLACEHOLDER,
  codexSourceNameError,
  collapseCodexSourceName,
  codexSourcesOrCore,
} from '@/lib/codex/sources';
import { useCodexSourceCatalog } from '@/hooks/use-codex-source-catalog';

export function AdminCodexSourceField({
  value,
  onChange,
}: {
  value: readonly string[];
  onChange: (next: string[]) => void;
}) {
  const { options: catalogOptions } = useCodexSourceCatalog();
  const catalog = useMemo(() => catalogOptions.map((option) => option.value), [catalogOptions]);
  const [draft, setDraft] = useState('');
  const [draftError, setDraftError] = useState<string | null>(null);

  const selected = codexSourcesOrCore(value, catalog);

  function commit(raw: string) {
    const collapsed = collapseCodexSourceName(raw);
    if (!collapsed) {
      setDraftError(null);
      return;
    }
    const error = codexSourceNameError(collapsed);
    if (error) {
      setDraftError(error);
      return;
    }
    onChange(codexSourcesOrCore([...selected, collapsed], catalog));
    setDraft('');
    setDraftError(null);
  }

  return (
    <div className="min-w-0">
      <ChipSelect
        label={CODEX_SOURCE_PICKER_LABEL}
        placeholder={CODEX_SOURCE_PICKER_PLACEHOLDER}
        options={catalogOptions}
        selectedValues={[...selected]}
        onSelect={(name) => {
          const error = codexSourceNameError(collapseCodexSourceName(name));
          if (error) {
            setDraftError(error);
            return;
          }
          setDraftError(null);
          onChange(codexSourcesOrCore([...selected, name], catalog));
        }}
        onRemove={
          selected.length > 1
            ? (name) =>
                onChange(
                  codexSourcesOrCore(
                    selected.filter((source) => source !== name),
                    catalog,
                  ),
                )
            : undefined
        }
      />
      <div className="mt-2">
        <Input
          value={draft}
          onChange={(e) => {
            setDraft(e.target.value);
            if (draftError) setDraftError(null);
          }}
          onKeyDown={(e) => {
            if (e.key !== 'Enter') return;
            e.preventDefault();
            e.stopPropagation();
            commit(draft);
          }}
          placeholder={CODEX_SOURCE_PICKER_PLACEHOLDER}
          aria-label={CODEX_SOURCE_PICKER_PLACEHOLDER}
          error={draftError ?? undefined}
        />
      </div>
    </div>
  );
}
