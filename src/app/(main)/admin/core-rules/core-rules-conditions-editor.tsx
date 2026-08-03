'use client';

import { Plus, Trash2 } from 'lucide-react';
import { FieldRow, SectionTitle, TextInput } from './core-rules-field-editors';

type ConditionRow = { name: string; leveled: boolean; description: string };

export function ConditionsEditor({
  data,
  set,
}: {
  data: Record<string, unknown>;
  set: (key: string, value: unknown) => void;
}) {
  const standard = (data.standard || []) as ConditionRow[];
  const leveled = (data.leveled || []) as ConditionRow[];

  return (
    <>
      <SectionTitle>Standard Conditions ({standard.length})</SectionTitle>
      <div className="space-y-2">
        {standard.map((c, i) => (
          <div key={i} className="flex items-start gap-2 p-2 rounded bg-surface-alt">
            <input
              value={c.name}
              aria-label={`Standard condition ${i + 1} name`}
              onChange={e => {
                const updated = [...standard];
                updated[i] = { ...c, name: e.target.value };
                set('standard', updated);
              }}
              className="w-32 px-2 py-1 text-sm font-medium rounded border border-border-light bg-surface"
            />
            <input
              value={c.description}
              aria-label={`Standard condition ${i + 1} description`}
              onChange={e => {
                const updated = [...standard];
                updated[i] = { ...c, description: e.target.value };
                set('standard', updated);
              }}
              className="flex-1 px-2 py-1 text-sm rounded border border-border-light bg-surface"
              placeholder="Description..."
            />
            <button
              type="button"
              onClick={() => {
                const updated = standard.filter((_, idx) => idx !== i);
                set('standard', updated);
              }}
              className="p-1 touch-target-md-compact text-text-muted dark:text-text-secondary hover:text-danger-fg transition-colors shrink-0"
              aria-label={`Remove standard condition ${c.name || i + 1}`}
              title="Remove condition"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={() => set('standard', [...standard, { name: 'New Condition', leveled: false, description: '' }])}
        className="mt-2 flex items-center gap-1 text-xs text-primary-link-fg hover:text-primary-fg-hover min-h-[44px] md:min-h-0"
      >
        <Plus className="w-3.5 h-3.5" /> Add Standard Condition
      </button>

      <SectionTitle>Leveled Conditions ({leveled.length})</SectionTitle>
      <div className="space-y-2">
        {leveled.map((c, i) => (
          <div key={i} className="flex items-start gap-2 p-2 rounded bg-surface-alt">
            <input
              value={c.name}
              aria-label={`Leveled condition ${i + 1} name`}
              onChange={e => {
                const updated = [...leveled];
                updated[i] = { ...c, name: e.target.value };
                set('leveled', updated);
              }}
              className="w-32 px-2 py-1 text-sm font-medium rounded border border-border-light bg-surface"
            />
            <input
              value={c.description}
              aria-label={`Leveled condition ${i + 1} description`}
              onChange={e => {
                const updated = [...leveled];
                updated[i] = { ...c, description: e.target.value };
                set('leveled', updated);
              }}
              className="flex-1 px-2 py-1 text-sm rounded border border-border-light bg-surface"
              placeholder="Description..."
            />
            <button
              type="button"
              onClick={() => {
                const updated = leveled.filter((_, idx) => idx !== i);
                set('leveled', updated);
              }}
              className="p-1 touch-target-md-compact text-text-muted dark:text-text-secondary hover:text-danger-fg transition-colors shrink-0"
              aria-label={`Remove leveled condition ${c.name || i + 1}`}
              title="Remove condition"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={() => set('leveled', [...leveled, { name: 'New Condition', leveled: true, description: '' }])}
        className="mt-2 flex items-center gap-1 text-xs text-primary-link-fg hover:text-primary-fg-hover min-h-[44px] md:min-h-0"
      >
        <Plus className="w-3.5 h-3.5" /> Add Leveled Condition
      </button>

      <FieldRow label="Stacking Rules"><TextInput wide value={data.stackingRules as string ?? ''} onChange={v => set('stackingRules', v)} /></FieldRow>
    </>
  );
}
