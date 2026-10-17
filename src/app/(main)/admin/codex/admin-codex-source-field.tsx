'use client';

import { useEffect, useState } from 'react';
import { ChipSelect } from '@/components/patterns/filters';
import { Input } from '@/components/ui';
import { collapseCodexSourceName, codexSourcesOrCore } from '@/lib/codex/sources';
import { listCodexSourceCatalog } from './source-catalog-action';

export function AdminCodexSourceField({
  value,
  onChange,
}: {
  value: readonly string[];
  onChange: (next: string[]) => void;
}) {
  const [catalog, setCatalog] = useState<string[]>([]);
  const [draft, setDraft] = useState('');

  useEffect(() => {
    let cancelled = false;
    listCodexSourceCatalog()
      .then((entries) => {
        if (!cancelled) setCatalog(entries.map((entry) => entry.name));
      })
      .catch(() => {
        if (!cancelled) setCatalog([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const selected = codexSourcesOrCore(value, catalog);
  const options = catalog.map((name) => ({ value: name, label: name }));

  function commit(raw: string) {
    const collapsed = collapseCodexSourceName(raw);
    if (!collapsed) return;
    onChange(codexSourcesOrCore([...selected, collapsed], catalog));
    setDraft('');
  }

  return (
    <div className="min-w-0">
      <ChipSelect
        label="Sources"
        placeholder="Add a source"
        options={options}
        selectedValues={[...selected]}
        onSelect={(name) => onChange(codexSourcesOrCore([...selected, name], catalog))}
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
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key !== 'Enter') return;
            e.preventDefault();
            e.stopPropagation();
            commit(draft);
          }}
          placeholder="Add a source"
          aria-label="Add a source"
        />
      </div>
    </div>
  );
}
