'use client';

import { Plus, Trash2 } from 'lucide-react';
import { TableScroll } from '@/components/ui';
import { NumInput, SectionTitle } from './core-rules-field-editors';

export function ArmamentProficiencyEditor({
  data,
  set,
}: {
  data: Record<string, unknown>;
  set: (key: string, value: unknown) => void;
}) {
  const table = (data.table || []) as Array<{ martialProf: number; armamentMax: number }>;

  return (
    <>
      <SectionTitle>Armament Proficiency Table</SectionTitle>
      <TableScroll>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-xs text-text-muted">
              <th className="px-4 py-1 text-center">Martial Prof</th>
              <th className="px-4 py-1 text-center">Armament Max (TP)</th>
              <th className="w-8">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {table.map((row, i) => (
              <tr key={i} className="border-b border-border-subtle">
                <td className="px-4 py-1 text-center">
                  <NumInput
                    value={row.martialProf}
                    onChange={(v) => {
                      const u = [...table];
                      u[i] = { ...row, martialProf: v };
                      set('table', u);
                    }}
                    min={0}
                  />
                </td>
                <td className="px-4 py-1 text-center">
                  <NumInput
                    value={row.armamentMax}
                    onChange={(v) => {
                      const u = [...table];
                      u[i] = { ...row, armamentMax: v };
                      set('table', u);
                    }}
                    min={0}
                  />
                </td>
                <td className="px-1 py-1">
                  <button
                    type="button"
                    onClick={() =>
                      set(
                        'table',
                        table.filter((_, idx) => idx !== i),
                      )
                    }
                    className="touch-target-md-compact p-1 text-text-muted hover:text-danger-fg"
                    aria-label={`Remove armament row ${i + 1}`}
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
        onClick={() => {
          const nextProf = table.length > 0 ? Math.max(...table.map((r) => r.martialProf)) + 1 : 0;
          const nextMax = table.length > 0 ? table[table.length - 1].armamentMax + 3 : 3;
          set('table', [...table, { martialProf: nextProf, armamentMax: nextMax }]);
        }}
        className="mt-2 flex min-h-[44px] items-center gap-1 text-xs text-primary-link-fg hover:text-primary-fg-hover md:min-h-0"
      >
        <Plus className="h-3.5 w-3.5" /> Add Row
      </button>
    </>
  );
}
