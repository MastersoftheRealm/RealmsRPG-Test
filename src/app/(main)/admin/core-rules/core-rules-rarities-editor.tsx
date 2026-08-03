'use client';

import { Plus, Trash2 } from 'lucide-react';
import { TableScroll } from '@/components/ui';
import { NumInput, SectionTitle } from './core-rules-field-editors';

export function RaritiesEditor({
  data,
  set,
}: {
  data: Record<string, unknown>;
  set: (key: string, value: unknown) => void;
}) {
  const tiers = (data.tiers || []) as Array<Record<string, unknown>>;
  const setTierField = (index: number, field: string, value: unknown) => {
    const updated = [...tiers];
    updated[index] = { ...updated[index], [field]: value };
    set('tiers', updated);
  };

  return (
    <>
      <SectionTitle>Rarity Tiers ({tiers.length})</SectionTitle>
      <TableScroll>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-xs text-text-muted dark:text-text-secondary border-b">
              <th className="text-left py-1 px-2">Name</th>
              <th className="text-center py-1 px-2">Level Min</th>
              <th className="text-center py-1 px-2">Level Max</th>
              <th className="text-center py-1 px-2">Currency Min</th>
              <th className="text-center py-1 px-2">Currency Max</th>
              <th className="w-8"><span className="sr-only">Actions</span></th>
            </tr>
          </thead>
          <tbody>
            {tiers.map((t, i) => (
              <tr key={i} className="border-b border-border-subtle">
                <td className="py-1 px-1">
                  <input value={t.name as string ?? ''} aria-label={`Rarity tier ${i + 1} name`} onChange={e => setTierField(i, 'name', e.target.value)} className="w-full px-2 py-1 text-sm rounded border border-border-light bg-surface" />
                </td>
                <td className="text-center py-1 px-1"><NumInput value={t.levelMin as number ?? 0} onChange={v => setTierField(i, 'levelMin', v)} min={0} /></td>
                <td className="text-center py-1 px-1"><NumInput value={t.levelMax as number ?? 0} onChange={v => setTierField(i, 'levelMax', v || null)} min={0} /></td>
                <td className="text-center py-1 px-1"><NumInput value={t.currencyMin as number ?? 0} onChange={v => setTierField(i, 'currencyMin', v)} min={0} /></td>
                <td className="text-center py-1 px-1"><NumInput value={t.currencyMax as number ?? 0} onChange={v => setTierField(i, 'currencyMax', v || null)} min={0} /></td>
                <td className="py-1 px-1">
                  <button
                    type="button"
                    onClick={() => set('tiers', tiers.filter((_, idx) => idx !== i))}
                    className="p-1 touch-target-md-compact text-text-muted dark:text-text-secondary hover:text-danger-fg"
                    aria-label={`Remove rarity tier ${(t.name as string) || i + 1}`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </TableScroll>
      <button
        type="button"
        onClick={() => set('tiers', [...tiers, { name: 'New Tier', levelMin: 1, levelMax: null, currencyMin: 0, currencyMax: null }])}
        className="mt-2 flex items-center gap-1 text-xs text-primary-link-fg hover:text-primary-fg-hover min-h-[44px] md:min-h-0"
      >
        <Plus className="w-3.5 h-3.5" /> Add Rarity Tier
      </button>
    </>
  );
}
