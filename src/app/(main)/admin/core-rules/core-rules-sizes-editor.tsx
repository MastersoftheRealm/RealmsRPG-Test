'use client';

import { Plus, Trash2 } from 'lucide-react';
import { TableScroll } from '@/components/ui';
import { FieldRow, NumInput, SectionTitle, TextInput } from './core-rules-field-editors';

export function SizesEditor({
  data,
  set,
}: {
  data: Record<string, unknown>;
  set: (key: string, value: unknown) => void;
}) {
  const categories = (data.categories || []) as Array<Record<string, unknown>>;
  const setSizeField = (index: number, field: string, value: unknown) => {
    const updated = [...categories];
    updated[index] = { ...updated[index], [field]: value };
    set('categories', updated);
  };

  return (
    <>
      <SectionTitle>Size Categories ({categories.length})</SectionTitle>
      <TableScroll>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-xs text-text-muted">
              <th className="px-2 py-1 text-left">Label</th>
              <th className="px-2 py-1 text-left">Height</th>
              <th className="px-2 py-1 text-center">Spaces</th>
              <th className="px-2 py-1 text-center">Base Carry</th>
              <th className="px-2 py-1 text-center">Per STR</th>
              <th className="px-2 py-1 text-center">Min Carry</th>
              <th className="w-8">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {categories.map((s, i) => (
              <tr key={i} className="border-b border-border-subtle">
                <td className="px-1 py-1">
                  <input
                    value={(s.label as string) ?? ''}
                    aria-label={`Size ${i + 1} label`}
                    onChange={(e) => setSizeField(i, 'label', e.target.value)}
                    className="w-full rounded border border-border-light bg-surface px-2 py-1 text-sm"
                  />
                </td>
                <td className="px-1 py-1">
                  <input
                    value={(s.height as string) ?? ''}
                    aria-label={`Size ${i + 1} height`}
                    onChange={(e) => setSizeField(i, 'height', e.target.value)}
                    className="w-full rounded border border-border-light bg-surface px-2 py-1 text-sm"
                  />
                </td>
                <td className="px-1 py-1 text-center">
                  <NumInput
                    value={(s.spaces as number) ?? 1}
                    onChange={(v) => setSizeField(i, 'spaces', v)}
                    min={0}
                  />
                </td>
                <td className="px-1 py-1 text-center">
                  <NumInput
                    value={(s.baseCarry as number) ?? 0}
                    onChange={(v) => setSizeField(i, 'baseCarry', v)}
                    min={0}
                  />
                </td>
                <td className="px-1 py-1 text-center">
                  <NumInput
                    value={(s.perStrCarry as number) ?? 0}
                    onChange={(v) => setSizeField(i, 'perStrCarry', v)}
                    min={0}
                  />
                </td>
                <td className="px-1 py-1 text-center">
                  <NumInput
                    value={(s.minCarry as number) ?? 0}
                    onChange={(v) => setSizeField(i, 'minCarry', v)}
                    min={0}
                  />
                </td>
                <td className="px-1 py-1">
                  <button
                    type="button"
                    onClick={() =>
                      set(
                        'categories',
                        categories.filter((_, idx) => idx !== i),
                      )
                    }
                    className="touch-target-md-compact p-1 text-text-muted hover:text-danger-fg"
                    aria-label={`Remove size ${(s.label as string) || i + 1}`}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </TableScroll>
      <button
        type="button"
        onClick={() =>
          set('categories', [
            ...categories,
            {
              value: 'custom',
              label: 'Custom',
              height: '-',
              spaces: 1,
              baseCarry: 0,
              perStrCarry: 0,
              minCarry: 0,
            },
          ])
        }
        className="mt-2 flex min-h-[44px] items-center gap-1 text-xs text-primary-link-fg hover:text-primary-fg-hover md:min-h-0"
      >
        <Plus className="h-3.5 w-3.5" /> Add Size Category
      </button>
      <FieldRow label="Half-Capacity Penalty">
        <TextInput
          wide
          value={(data.halfCapacitySpeedPenalty as string) ?? ''}
          onChange={(v) => set('halfCapacitySpeedPenalty', v)}
        />
      </FieldRow>
      <FieldRow label="Space and shape">
        <TextInput
          wide
          value={(data.spaceAndShape as string) ?? ''}
          onChange={(v) => set('spaceAndShape', v)}
        />
      </FieldRow>
      <FieldRow label="Carrying notes">
        <TextInput
          wide
          value={(data.carryingNotes as string) ?? ''}
          onChange={(v) => set('carryingNotes', v)}
        />
      </FieldRow>
      <FieldRow label="Movement through enemies">
        <TextInput
          wide
          value={(data.movementThroughEnemySpaces as string) ?? ''}
          onChange={(v) => set('movementThroughEnemySpaces', v)}
        />
      </FieldRow>
    </>
  );
}
