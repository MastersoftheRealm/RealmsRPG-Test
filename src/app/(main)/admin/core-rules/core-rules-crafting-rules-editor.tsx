'use client';

import { Plus, Trash2 } from 'lucide-react';
import { TableScroll } from '@/components/ui';
import { FieldRow, NumInput, SectionTitle } from './core-rules-field-editors';

export function CraftingRulesEditor({
  data,
  set,
}: {
  data: Record<string, unknown>;
  set: (key: string, value: unknown) => void;
}) {
  const generalTable = (data.generalTable || []) as Array<Record<string, unknown>>;
  const successesTable = (data.successesTable || []) as Array<Record<string, unknown>>;
  const setGeneralRow = (i: number, field: string, value: unknown) => {
    const u = [...generalTable];
    u[i] = { ...u[i], [field]: value };
    set('generalTable', u);
  };
  const setSuccessesRow = (i: number, field: string, value: unknown) => {
    const u = [...successesTable];
    u[i] = { ...u[i], [field]: value };
    set('successesTable', u);
  };

  return (
    <>
      <SectionTitle>Crafting Multipliers</SectionTitle>
      <FieldRow label="Crafting cost (material) multiplier" hint="e.g. 0.75 = 75%">
        <NumInput
          value={(data.craftingCostMultiplier as number) ?? 0.75}
          onChange={(v) => set('craftingCostMultiplier', v)}
          step={0.01}
          min={0}
          max={2}
        />
      </FieldRow>
      <FieldRow label="Consumable time multiplier" hint="e.g. 0.25 = ¼">
        <NumInput
          value={(data.consumableTimeMultiplier as number) ?? 0.25}
          onChange={(v) => set('consumableTimeMultiplier', v)}
          step={0.01}
          min={0}
          max={1}
        />
      </FieldRow>
      <FieldRow label="Crafting day (hours)">
        <NumInput
          value={(data.craftingDayHours as number) ?? 8}
          onChange={(v) => set('craftingDayHours', v)}
          min={1}
        />
      </FieldRow>
      <FieldRow label="Enhanced sell price multiplier" hint="e.g. 1.25 = 125%">
        <NumInput
          value={(data.enhancedSellPriceMultiplier as number) ?? 1.25}
          onChange={(v) => set('enhancedSellPriceMultiplier', v)}
          step={0.01}
          min={0}
        />
      </FieldRow>
      <FieldRow label="Upgrade material cost multiplier">
        <NumInput
          value={(data.upgradeMaterialCostMultiplier as number) ?? 0.75}
          onChange={(v) => set('upgradeMaterialCostMultiplier', v)}
          step={0.01}
          min={0}
        />
      </FieldRow>
      <FieldRow label="NPC upgrade cost multiplier">
        <NumInput
          value={(data.npcUpgradeCostMultiplier as number) ?? 1}
          onChange={(v) => set('npcUpgradeCostMultiplier', v)}
          step={0.01}
          min={0}
        />
      </FieldRow>
      <FieldRow label="NPC service fee (with materials)">
        <NumInput
          value={(data.npcServiceFeeWithMaterials as number) ?? 0.25}
          onChange={(v) => set('npcServiceFeeWithMaterials', v)}
          step={0.01}
          min={0}
        />
      </FieldRow>
      <FieldRow label="Bulk craft count (items produced)">
        <NumInput
          value={(data.bulkCraftCount as number) ?? 4}
          onChange={(v) => set('bulkCraftCount', v)}
          min={1}
        />
      </FieldRow>
      <FieldRow label="Bulk craft material count (pay for N)">
        <NumInput
          value={(data.bulkCraftMaterialCount as number) ?? 3}
          onChange={(v) => set('bulkCraftMaterialCount', v)}
          min={1}
        />
      </FieldRow>

      <SectionTitle>General Crafting Table ({generalTable.length})</SectionTitle>
      <p className="mb-2 text-xs text-text-muted">
        Currency cost brackets → rarity, DS, successes, time.
      </p>
      <TableScroll>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-xs text-text-muted">
              <th className="px-1 py-1 text-right">Currency Min</th>
              <th className="px-1 py-1 text-right">Currency Max</th>
              <th className="px-1 py-1 text-left">Rarity</th>
              <th className="px-1 py-1 text-center">DS</th>
              <th className="px-1 py-1 text-center">Successes</th>
              <th className="px-1 py-1 text-center">Time</th>
              <th className="px-1 py-1 text-left">Unit</th>
              <th className="w-8">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {generalTable.map((row, i) => (
              <tr key={i} className="border-b border-border-subtle">
                <td className="px-1 py-1">
                  <NumInput
                    value={(row.currencyMin as number) ?? 0}
                    onChange={(v) => setGeneralRow(i, 'currencyMin', v)}
                    min={0}
                  />
                </td>
                <td className="px-1 py-1">
                  <input
                    type="number"
                    value={row.currencyMax != null ? (row.currencyMax as number) : ''}
                    min={0}
                    onChange={(e) => {
                      const v = e.target.value;
                      setGeneralRow(i, 'currencyMax', v === '' ? null : parseFloat(v));
                    }}
                    className="w-20 rounded border border-border-light bg-surface px-2 py-1 text-sm"
                    placeholder="-"
                    aria-label="Currency max"
                  />
                </td>
                <td className="px-1 py-1">
                  <input
                    value={(row.rarity as string) ?? ''}
                    aria-label={`General crafting row ${i + 1} rarity`}
                    onChange={(e) => setGeneralRow(i, 'rarity', e.target.value)}
                    className="w-24 rounded border border-border-light bg-surface px-2 py-1 text-sm"
                  />
                </td>
                <td className="px-1 py-1">
                  <NumInput
                    value={(row.difficultyScore as number) ?? 14}
                    onChange={(v) => setGeneralRow(i, 'difficultyScore', v)}
                    min={1}
                  />
                </td>
                <td className="px-1 py-1">
                  <NumInput
                    value={(row.successes as number) ?? 1}
                    onChange={(v) => setGeneralRow(i, 'successes', v)}
                    min={1}
                  />
                </td>
                <td className="px-1 py-1">
                  <NumInput
                    value={(row.timeValue as number) ?? 0}
                    onChange={(v) => setGeneralRow(i, 'timeValue', v)}
                    min={0}
                  />
                </td>
                <td className="px-1 py-1">
                  <select
                    value={(row.timeUnit as string) ?? 'days'}
                    aria-label={`General crafting row ${i + 1} time unit`}
                    onChange={(e) => setGeneralRow(i, 'timeUnit', e.target.value)}
                    className="rounded border border-border-light bg-surface px-2 py-1 text-sm"
                  >
                    <option value="hours">hours</option>
                    <option value="days">days</option>
                  </select>
                </td>
                <td className="px-1 py-1">
                  <button
                    type="button"
                    onClick={() =>
                      set(
                        'generalTable',
                        generalTable.filter((_, idx) => idx !== i),
                      )
                    }
                    className="touch-target-md-compact p-1 text-text-muted hover:text-danger-fg"
                    aria-label="Remove row"
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
          set('generalTable', [
            ...generalTable,
            {
              currencyMin: 0,
              currencyMax: null,
              rarity: 'Common',
              difficultyScore: 14,
              successes: 1,
              timeValue: 8,
              timeUnit: 'hours',
            },
          ])
        }
        className="mt-2 flex min-h-[44px] items-center gap-1 text-xs text-primary-link-fg hover:text-primary-fg-hover md:min-h-0"
      >
        <Plus className="h-3.5 w-3.5" /> Add Row
      </button>

      <SectionTitle>Successes Table ({successesTable.length})</SectionTitle>
      <p className="mb-2 text-xs text-text-muted">
        Delta from required successes → failure/success effects.
      </p>
      <TableScroll>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-xs text-text-muted">
              <th className="px-1 py-1 text-center">Delta</th>
              <th className="px-1 py-1 text-left">Failure Effect</th>
              <th className="px-1 py-1 text-left">Success Effect</th>
              <th className="px-1 py-1 text-center">Fail %</th>
              <th className="px-1 py-1 text-center">Success %</th>
              <th className="px-1 py-1 text-center">Retain %</th>
              <th className="w-8">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {successesTable.map((row, i) => (
              <tr key={i} className="border-b border-border-subtle">
                <td className="px-1 py-1">
                  <NumInput
                    value={(row.delta as number) ?? 0}
                    onChange={(v) => setSuccessesRow(i, 'delta', v)}
                    min={0}
                  />
                </td>
                <td className="px-1 py-1">
                  <input
                    value={(row.failureEffect as string) ?? ''}
                    aria-label={`Successes row ${i + 1} failure effect`}
                    onChange={(e) => setSuccessesRow(i, 'failureEffect', e.target.value)}
                    className="w-full min-w-[120px] rounded border border-border-light bg-surface px-2 py-1 text-sm"
                  />
                </td>
                <td className="px-1 py-1">
                  <input
                    value={(row.successEffect as string) ?? ''}
                    aria-label={`Successes row ${i + 1} success effect`}
                    onChange={(e) => setSuccessesRow(i, 'successEffect', e.target.value)}
                    className="w-full min-w-[120px] rounded border border-border-light bg-surface px-2 py-1 text-sm"
                  />
                </td>
                <td className="px-1 py-1">
                  <NumInput
                    value={(row.failureItemWorthPercent as number) ?? 0}
                    onChange={(v) => setSuccessesRow(i, 'failureItemWorthPercent', v)}
                    min={0}
                    max={100}
                  />
                </td>
                <td className="px-1 py-1">
                  <NumInput
                    value={(row.successItemWorthPercent as number) ?? 0}
                    onChange={(v) => setSuccessesRow(i, 'successItemWorthPercent', v)}
                    min={0}
                    max={200}
                  />
                </td>
                <td className="px-1 py-1">
                  <NumInput
                    value={(row.materialsRetainedPercent as number) ?? 0}
                    onChange={(v) => setSuccessesRow(i, 'materialsRetainedPercent', v)}
                    min={0}
                    max={100}
                  />
                </td>
                <td className="px-1 py-1">
                  <button
                    type="button"
                    onClick={() =>
                      set(
                        'successesTable',
                        successesTable.filter((_, idx) => idx !== i),
                      )
                    }
                    className="touch-target-md-compact p-1 text-text-muted hover:text-danger-fg"
                    aria-label="Remove row"
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
          set('successesTable', [
            ...successesTable,
            { delta: 0, failureEffect: '', successEffect: '' },
          ])
        }
        className="mt-2 flex min-h-[44px] items-center gap-1 text-xs text-primary-link-fg hover:text-primary-fg-hover md:min-h-0"
      >
        <Plus className="h-3.5 w-3.5" /> Add Row
      </button>
    </>
  );
}
