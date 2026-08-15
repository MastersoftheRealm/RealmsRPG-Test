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
          <div key={i} className="flex items-start gap-2 rounded bg-surface-alt p-2">
            <input
              value={c.name}
              aria-label={`Standard condition ${i + 1} name`}
              onChange={(e) => {
                const updated = [...standard];
                updated[i] = { ...c, name: e.target.value };
                set('standard', updated);
              }}
              className="w-32 rounded border border-border-light bg-surface px-2 py-1 text-sm font-medium"
            />
            <input
              value={c.description}
              aria-label={`Standard condition ${i + 1} description`}
              onChange={(e) => {
                const updated = [...standard];
                updated[i] = { ...c, description: e.target.value };
                set('standard', updated);
              }}
              className="flex-1 rounded border border-border-light bg-surface px-2 py-1 text-sm"
              placeholder="Description..."
            />
            <button
              type="button"
              onClick={() => {
                const updated = standard.filter((_, idx) => idx !== i);
                set('standard', updated);
              }}
              className="touch-target-md-compact shrink-0 p-1 text-text-muted transition-colors hover:text-danger-fg"
              aria-label={`Remove standard condition ${c.name || i + 1}`}
              title="Remove condition"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={() =>
          set('standard', [...standard, { name: 'New Condition', leveled: false, description: '' }])
        }
        className="mt-2 flex min-h-[44px] items-center gap-1 text-xs text-primary-link-fg hover:text-primary-fg-hover md:min-h-0"
      >
        <Plus className="h-3.5 w-3.5" /> Add Standard Condition
      </button>

      <SectionTitle>Leveled Conditions ({leveled.length})</SectionTitle>
      <div className="space-y-2">
        {leveled.map((c, i) => (
          <div key={i} className="flex items-start gap-2 rounded bg-surface-alt p-2">
            <input
              value={c.name}
              aria-label={`Leveled condition ${i + 1} name`}
              onChange={(e) => {
                const updated = [...leveled];
                updated[i] = { ...c, name: e.target.value };
                set('leveled', updated);
              }}
              className="w-32 rounded border border-border-light bg-surface px-2 py-1 text-sm font-medium"
            />
            <input
              value={c.description}
              aria-label={`Leveled condition ${i + 1} description`}
              onChange={(e) => {
                const updated = [...leveled];
                updated[i] = { ...c, description: e.target.value };
                set('leveled', updated);
              }}
              className="flex-1 rounded border border-border-light bg-surface px-2 py-1 text-sm"
              placeholder="Description..."
            />
            <button
              type="button"
              onClick={() => {
                const updated = leveled.filter((_, idx) => idx !== i);
                set('leveled', updated);
              }}
              className="touch-target-md-compact shrink-0 p-1 text-text-muted transition-colors hover:text-danger-fg"
              aria-label={`Remove leveled condition ${c.name || i + 1}`}
              title="Remove condition"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={() =>
          set('leveled', [...leveled, { name: 'New Condition', leveled: true, description: '' }])
        }
        className="mt-2 flex min-h-[44px] items-center gap-1 text-xs text-primary-link-fg hover:text-primary-fg-hover md:min-h-0"
      >
        <Plus className="h-3.5 w-3.5" /> Add Leveled Condition
      </button>

      <FieldRow label="Stacking Rules">
        <TextInput
          wide
          value={(data.stackingRules as string) ?? ''}
          onChange={(v) => set('stackingRules', v)}
        />
      </FieldRow>
    </>
  );
}
