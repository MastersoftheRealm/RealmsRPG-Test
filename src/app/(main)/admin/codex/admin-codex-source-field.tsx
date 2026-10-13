'use client';

import { useId, useRef, useState } from 'react';
import { Input } from '@/components/ui';
import {
  codexSourceSelectValue,
  commitCodexSourceDraft,
  mergeCodexSourceOptions,
  nextCodexSourceSelection,
} from './admin-codex-source';

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
  const selectRef = useRef<HTMLSelectElement>(null);
  const [addingNew, setAddingNew] = useState(() => value.trim() !== '' && !options.includes(value));
  const [accepted, setAccepted] = useState<string[]>([]);
  const selectable = mergeCodexSourceOptions(options, accepted);
  const selectValue = codexSourceSelectValue(value, selectable, addingNew);
  const showNewInput = selectValue === '__new__';

  function commitDraft(moveFocus: boolean) {
    const committed = commitCodexSourceDraft(value, selectable);
    if (!committed) return;
    setAccepted((prev) =>
      prev.includes(committed.value) || options.includes(committed.value)
        ? prev
        : [...prev, committed.value],
    );
    setAddingNew(false);
    if (committed.value !== value) onChange(committed.value);
    if (moveFocus) selectRef.current?.focus();
  }

  return (
    <div className="min-w-0">
      <label htmlFor={selectId} className="mb-1 block text-sm font-medium text-text-secondary">
        Source
      </label>
      <select
        ref={selectRef}
        id={selectId}
        value={selectValue}
        onChange={(e) => {
          const next = nextCodexSourceSelection(e.target.value, value, selectable);
          setAddingNew(next.addingNew);
          onChange(next.value);
        }}
        className="touch-tier-standard w-full rounded-md border border-border bg-background px-3 py-2 text-text-primary"
        aria-label="Source"
      >
        <option value="">None</option>
        {selectable.map((source) => (
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
          onKeyDown={(e) => {
            if (e.key !== 'Enter') return;
            e.preventDefault();
            commitDraft(true);
          }}
          onBlur={() => commitDraft(false)}
          placeholder="Type a source, then press Enter"
          className="mt-2"
          aria-label="New source"
        />
      )}
      <p className="mt-1 text-xs text-text-muted">
        {showNewInput ? 'Press Enter to use this source.' : hint}
      </p>
    </div>
  );
}
