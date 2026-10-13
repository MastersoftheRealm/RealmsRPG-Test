'use client';

import { Plus, Trash2 } from 'lucide-react';
import {
  CORE_RULES_ADD_ROW_CLASS,
  FieldRow,
  SectionTitle,
  TextInput,
} from './core-rules-field-editors';
import {
  readConditionsEditor,
  writeConditionsEditor,
  type ConditionEditorRow,
  type ConditionsEditorModel,
} from './core-rules-conditions';

function ConditionList({
  rows,
  kind,
  emptyLabel,
  onName,
  onDescription,
  onRemove,
}: {
  rows: ConditionEditorRow[];
  kind: 'standard' | 'leveled';
  emptyLabel: string;
  onName: (index: number, name: string) => void;
  onDescription: (index: number, description: string) => void;
  onRemove: (index: number) => void;
}) {
  if (rows.length === 0) {
    return <p className="text-sm text-text-secondary">{emptyLabel}</p>;
  }

  const label = kind === 'standard' ? 'Standard' : 'Leveled';
  return (
    <div className="space-y-2">
      {rows.map((row, i) => (
        <div
          key={row.key || `${kind}-${i}`}
          className="flex items-start gap-2 rounded bg-surface-alt p-2"
        >
          <input
            value={row.name}
            aria-label={`${label} condition ${i + 1} name`}
            onChange={(e) => onName(i, e.target.value)}
            className="w-32 rounded border border-border-light bg-surface px-2 py-1 text-sm font-medium"
          />
          <input
            value={row.description}
            aria-label={`${label} condition ${i + 1} description`}
            onChange={(e) => onDescription(i, e.target.value)}
            className="flex-1 rounded border border-border-light bg-surface px-2 py-1 text-sm"
            placeholder="Description..."
          />
          <button
            type="button"
            onClick={() => onRemove(i)}
            className="hit-area-dense-square shrink-0 p-1 text-text-muted transition-colors hover:text-danger-fg"
            aria-label={`Remove ${kind} condition ${row.name || i + 1}`}
            title="Remove condition"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
}

export function ConditionsEditor({
  data,
  onChange,
}: {
  data: Record<string, unknown>;
  onChange: (data: Record<string, unknown>) => void;
}) {
  const model = readConditionsEditor(data);

  const commit = (next: ConditionsEditorModel) => {
    onChange(writeConditionsEditor(data, next));
  };

  const patchList = (
    list: 'standard' | 'leveled',
    index: number,
    patch: Partial<ConditionEditorRow>,
  ) => {
    const rows = model[list].map((row, i) => (i === index ? { ...row, ...patch } : row));
    commit({ ...model, [list]: rows });
  };

  return (
    <>
      <SectionTitle>Standard Conditions ({model.standard.length})</SectionTitle>
      <ConditionList
        rows={model.standard}
        kind="standard"
        emptyLabel="No standard conditions stored."
        onName={(index, name) => patchList('standard', index, { name })}
        onDescription={(index, description) => patchList('standard', index, { description })}
        onRemove={(index) =>
          commit({ ...model, standard: model.standard.filter((_, i) => i !== index) })
        }
      />
      <button
        type="button"
        onClick={() =>
          commit({
            ...model,
            standard: [
              ...model.standard,
              { key: '', name: 'New Condition', description: '', leveled: false },
            ],
          })
        }
        className={CORE_RULES_ADD_ROW_CLASS}
      >
        <Plus className="h-3.5 w-3.5" /> Add Standard Condition
      </button>

      <SectionTitle>Leveled Conditions ({model.leveled.length})</SectionTitle>
      <ConditionList
        rows={model.leveled}
        kind="leveled"
        emptyLabel="No leveled conditions stored."
        onName={(index, name) => patchList('leveled', index, { name })}
        onDescription={(index, description) => patchList('leveled', index, { description })}
        onRemove={(index) =>
          commit({ ...model, leveled: model.leveled.filter((_, i) => i !== index) })
        }
      />
      <button
        type="button"
        onClick={() =>
          commit({
            ...model,
            leveled: [
              ...model.leveled,
              { key: '', name: 'New Condition', description: '', leveled: true },
            ],
          })
        }
        className={CORE_RULES_ADD_ROW_CLASS}
      >
        <Plus className="h-3.5 w-3.5" /> Add Leveled Condition
      </button>

      <FieldRow label="Stacking Rules">
        <TextInput
          wide
          value={model.stackingRules}
          onChange={(v) => commit({ ...model, stackingRules: v })}
        />
      </FieldRow>
    </>
  );
}
