'use client';

import { useId, useState } from 'react';
import { Input } from '@/components/ui';
import { codexSourceSelectValue, nextCodexSourceSelection } from './admin-codex-source';

const DEFAULT_HINT = 'Which rules source this comes from, such as Core Rules or an expansion.';

export function AdminCodexSourceField({
  value,
  options,
  onChange,
  hint = DEFAULT_HINT,
}: {
  value: string;
  options: string[];
  onChange: (next: string) => void;
  hint?: string;
}) {
  const selectId = useId();
  const [addingNew, setAddingNew] = useState(() => value.trim() !== '' && !options.includes(value));
  const selectValue = codexSourceSelectValue(value, options, addingNew);
  const showNewInput = selectValue === '__new__';

  return (
    <div className="min-w-0">
      <label htmlFor={selectId} className="mb-1 block text-sm font-medium text-text-secondary">
        Source
      </label>
      <select
        id={selectId}
        value={selectValue}
        onChange={(e) => {
          const next = nextCodexSourceSelection(e.target.value, value, options);
          setAddingNew(next.addingNew);
          onChange(next.value);
        }}
        className="touch-tier-standard w-full rounded-md border border-border bg-background px-3 py-2 text-text-primary"
        aria-label="Source"
      >
        <option value="">None</option>
        {options.map((source) => (
          <option key={source} value={source}>
            {source}
          </option>
        ))}
        <option value="__new__">Add new source...</option>
      </select>
      {showNewInput && (
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Type new source"
          className="mt-2"
          aria-label="New source"
        />
      )}
      <p className="mt-1 text-xs text-text-muted">{hint}</p>
    </div>
  );
}
