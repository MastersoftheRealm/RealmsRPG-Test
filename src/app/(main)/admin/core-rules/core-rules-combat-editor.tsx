'use client';

import { FieldRow, NumInput, SectionTitle } from './core-rules-field-editors';

export function CombatEditor({
  data,
  set,
  setNested,
}: {
  data: Record<string, unknown>;
  set: (key: string, value: unknown) => void;
  setNested: (parent: string, key: string, value: unknown) => void;
}) {
  return (
    <>
      <SectionTitle>Base Combat Values</SectionTitle>
      <FieldRow label="Base Speed"><NumInput value={data.baseSpeed as number ?? 6} onChange={v => set('baseSpeed', v)} /></FieldRow>
      <FieldRow label="Base Evasion"><NumInput value={data.baseEvasion as number ?? 10} onChange={v => set('baseEvasion', v)} /></FieldRow>
      <FieldRow label="Base Defense"><NumInput value={data.baseDefense as number ?? 10} onChange={v => set('baseDefense', v)} /></FieldRow>
      <FieldRow label="AP Per Round"><NumInput value={data.apPerRound as number ?? 4} onChange={v => set('apPerRound', v)} /></FieldRow>
      <FieldRow label="Multiple Action Penalty"><NumInput value={data.multipleActionPenalty as number ?? -5} onChange={v => set('multipleActionPenalty', v)} /></FieldRow>

      <SectionTitle>Critical Hits &amp; Natural Rolls</SectionTitle>
      <FieldRow label="Critical Hit Threshold" hint="Roll exceeds defense by this much"><NumInput value={data.criticalHitThreshold as number ?? 10} onChange={v => set('criticalHitThreshold', v)} /></FieldRow>
      <FieldRow label="Natural 20 Bonus"><NumInput value={data.natural20Bonus as number ?? 2} onChange={v => set('natural20Bonus', v)} /></FieldRow>
      <FieldRow label="Natural 1 Penalty"><NumInput value={data.natural1Penalty as number ?? -2} onChange={v => set('natural1Penalty', v)} /></FieldRow>

      <SectionTitle>Range Penalties</SectionTitle>
      <FieldRow label="Ranged in Melee Penalty"><NumInput value={data.rangedMeleePenalty as number ?? -5} onChange={v => set('rangedMeleePenalty', v)} /></FieldRow>
      <FieldRow label="Long Range Penalty"><NumInput value={data.longRangePenalty as number ?? -5} onChange={v => set('longRangePenalty', v)} /></FieldRow>

      <SectionTitle>Action Costs (AP)</SectionTitle>
      {data.actionCosts && typeof data.actionCosts === 'object' && Object.entries(data.actionCosts as Record<string, number>).map(([key, val]) => (
        <FieldRow key={key} label={key.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase())}>
          <NumInput value={val} onChange={v => setNested('actionCosts', key, v)} min={0} />
        </FieldRow>
      ))}
    </>
  );
}
