'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Chip } from '@/components/ui';
import { FieldRow, SectionTitle, TextInput } from './core-rules-field-editors';

export function DamageTypesEditor({
  data,
  set,
}: {
  data: Record<string, unknown>;
  set: (key: string, value: unknown) => void;
}) {
  const all = (data.all || []) as string[];
  const exceptions = (data.armorExceptions || []) as string[];
  const [newType, setNewType] = useState('');
  return (
    <>
      <SectionTitle>All Damage Types ({all.length})</SectionTitle>
      <div className="flex flex-wrap gap-1.5 mb-3">
        {all.map((t) => (
          <Chip
            key={t}
            shape="rounded"
            variant={exceptions.includes(t) ? 'warning' : 'descriptor'}
            size="sm"
            onRemove={() => {
              set('all', all.filter((x) => x !== t));
              if (exceptions.includes(t)) set('armorExceptions', exceptions.filter((x) => x !== t));
            }}
          >
            {t}{exceptions.includes(t) ? ' ⚡' : ''}
          </Chip>
        ))}
      </div>
      <div className="flex items-center gap-2 mb-4">
        <input value={newType} onChange={(e) => setNewType(e.target.value)} placeholder="New damage type..." className="w-48 px-2 py-1 text-sm rounded border border-border-light bg-surface" />
        <button
          type="button"
          onClick={() => {
            if (newType.trim() && !all.includes(newType.trim())) {
              set('all', [...all, newType.trim()]);
              setNewType('');
            }
          }}
          className="text-xs text-primary-link-fg hover:text-primary-fg-hover flex items-center gap-1"
        >
          <Plus className="w-3.5 h-3.5" /> Add
        </button>
      </div>

      <SectionTitle>Armor Exception Types</SectionTitle>
      <p className="text-sm text-text-muted dark:text-text-secondary mb-2">These damage types bypass armor damage reduction. Click to toggle.</p>
      <div className="flex flex-wrap gap-1.5">
        {all.map((t) => (
          <Chip
            key={t}
            shape="rounded"
            variant={exceptions.includes(t) ? 'warning' : 'descriptor'}
            size="sm"
            interactive
            className={exceptions.includes(t) ? 'ring-1 ring-warning-300' : undefined}
            onClick={() => {
              if (exceptions.includes(t)) {
                set('armorExceptions', exceptions.filter((x) => x !== t));
              } else {
                set('armorExceptions', [...exceptions, t]);
              }
            }}
          >
            {t}{exceptions.includes(t) ? ' ⚡' : ''}
          </Chip>
        ))}
      </div>
      <FieldRow label="Note"><TextInput wide value={(data.note as string) ?? ''} onChange={(v) => set('note', v)} /></FieldRow>
    </>
  );
}
