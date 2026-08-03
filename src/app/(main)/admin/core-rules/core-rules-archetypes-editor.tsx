'use client';

import { FieldRow, NumInput, SectionTitle } from './core-rules-field-editors';

export function ArchetypesEditor({
  data,
  set,
}: {
  data: Record<string, unknown>;
  set: (key: string, value: unknown) => void;
}) {
  const configs = (data.configs || {}) as Record<string, Record<string, unknown>>;

  return (
    <>
      <SectionTitle>Archetype Progression</SectionTitle>
      <FieldRow label="Martial Bonus Feats (base)"><NumInput value={data.martialBonusFeatsBase as number ?? 2} onChange={v => set('martialBonusFeatsBase', v)} /></FieldRow>
      <FieldRow label="Martial Bonus Feats Interval"><NumInput value={data.martialBonusFeatsInterval as number ?? 3} onChange={v => set('martialBonusFeatsInterval', v)} /></FieldRow>
      <FieldRow label="Martial Bonus Start Level"><NumInput value={data.martialBonusFeatsStartLevel as number ?? 4} onChange={v => set('martialBonusFeatsStartLevel', v)} /></FieldRow>
      <FieldRow label="P-M Milestone Interval"><NumInput value={data.poweredMartialMilestoneInterval as number ?? 3} onChange={v => set('poweredMartialMilestoneInterval', v)} /></FieldRow>
      <FieldRow label="P-M Milestone Start Level"><NumInput value={data.poweredMartialMilestoneStartLevel as number ?? 4} onChange={v => set('poweredMartialMilestoneStartLevel', v)} /></FieldRow>
      <FieldRow label="Proficiency Increase Interval"><NumInput value={data.proficiencyIncreaseInterval as number ?? 5} onChange={v => set('proficiencyIncreaseInterval', v)} /></FieldRow>

      {['power', 'powered-martial', 'martial'].map(archType => {
        const cfg = configs[archType] || {};
        const setArchField = (field: string, value: unknown) => {
          const updated = { ...configs, [archType]: { ...cfg, [field]: value } };
          set('configs', updated);
        };
        return (
          <div key={archType}>
            <SectionTitle>{archType.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')} Config</SectionTitle>
            <FieldRow label="Feat Limit"><NumInput value={cfg.featLimit as number ?? 0} onChange={v => setArchField('featLimit', v)} /></FieldRow>
            <FieldRow label="Armament Max"><NumInput value={cfg.armamentMax as number ?? 3} onChange={v => setArchField('armamentMax', v)} /></FieldRow>
            <FieldRow label="Innate Energy"><NumInput value={cfg.innateEnergy as number ?? 0} onChange={v => setArchField('innateEnergy', v)} /></FieldRow>
            <FieldRow label="Innate Threshold"><NumInput value={cfg.innateThreshold as number ?? 0} onChange={v => setArchField('innateThreshold', v)} /></FieldRow>
            <FieldRow label="Innate Pools"><NumInput value={cfg.innatePools as number ?? 0} onChange={v => setArchField('innatePools', v)} /></FieldRow>
            <FieldRow label="Training Point Bonus"><NumInput value={cfg.trainingPointBonus as number ?? 0} onChange={v => setArchField('trainingPointBonus', v)} /></FieldRow>
          </div>
        );
      })}
    </>
  );
}
