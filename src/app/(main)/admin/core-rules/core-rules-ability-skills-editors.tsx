'use client';

import { Plus, Trash2 } from 'lucide-react';
import { FieldRow, NumInput, SectionTitle } from './core-rules-field-editors';

export function AbilityRulesEditor({
  data,
  set,
}: {
  data: Record<string, unknown>;
  set: (key: string, value: unknown) => void;
}) {
  const arrays = (data.standardArrays || {}) as Record<string, number[]>;

  return (
    <>
      <SectionTitle>Ability Limits</SectionTitle>
      <FieldRow label="Minimum">
        <NumInput value={(data.min as number) ?? -2} onChange={(v) => set('min', v)} />
      </FieldRow>
      <FieldRow label="Max at Creation">
        <NumInput
          value={(data.maxStarting as number) ?? 3}
          onChange={(v) => set('maxStarting', v)}
        />
      </FieldRow>
      <FieldRow label="Max (Characters)">
        <NumInput
          value={(data.maxAbsoluteCharacter as number) ?? 10}
          onChange={(v) => set('maxAbsoluteCharacter', v)}
        />
      </FieldRow>
      <FieldRow label="Max (Creatures)">
        <NumInput
          value={(data.maxAbsoluteCreature as number) ?? 20}
          onChange={(v) => set('maxAbsoluteCreature', v)}
        />
      </FieldRow>
      <FieldRow label="Cost Increase Threshold" hint="Costs 2 at this value+">
        <NumInput
          value={(data.costIncreaseThreshold as number) ?? 4}
          onChange={(v) => set('costIncreaseThreshold', v)}
        />
      </FieldRow>
      <FieldRow label="Normal Cost">
        <NumInput value={(data.normalCost as number) ?? 1} onChange={(v) => set('normalCost', v)} />
      </FieldRow>
      <FieldRow label="Increased Cost">
        <NumInput
          value={(data.increasedCost as number) ?? 2}
          onChange={(v) => set('increasedCost', v)}
        />
      </FieldRow>
      <FieldRow label="Max Total Negative">
        <NumInput
          value={(data.maxTotalNegative as number) ?? -3}
          onChange={(v) => set('maxTotalNegative', v)}
        />
      </FieldRow>

      <SectionTitle>Standard Arrays</SectionTitle>
      {Object.entries(arrays).map(([name, values]) => (
        <div key={name} className="flex items-center gap-2 border-b border-border-subtle py-2">
          <span className="w-24 text-sm font-medium text-text-secondary capitalize">{name}</span>
          <div className="flex gap-1">
            {values.map((v, i) => (
              <input
                key={i}
                type="number"
                value={v}
                aria-label={`${name} array value ${i + 1}`}
                onChange={(e) => {
                  const updated = [...values];
                  updated[i] = parseInt(e.target.value) || 0;
                  set('standardArrays', { ...arrays, [name]: updated });
                }}
                className="w-14 rounded border border-border-light bg-surface px-2 py-1 text-center text-sm"
              />
            ))}
          </div>
          <button
            type="button"
            onClick={() => {
              const updated = { ...arrays };
              delete updated[name];
              set('standardArrays', updated);
            }}
            className="touch-target-md-compact p-1 text-text-muted transition-colors hover:text-danger-fg"
            aria-label={`Remove ${name} array`}
            title="Remove array"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={() => {
          const newName = `custom_${Object.keys(arrays).length + 1}`;
          set('standardArrays', { ...arrays, [newName]: [2, 2, 1, 1, 0, -1] });
        }}
        className="mt-2 flex min-h-[44px] items-center gap-1 text-xs text-primary-link-fg hover:text-primary-fg-hover md:min-h-0"
      >
        <Plus className="h-3.5 w-3.5" /> Add Standard Array
      </button>
    </>
  );
}

export function SkillsAndDefensesEditor({
  data,
  set,
}: {
  data: Record<string, unknown>;
  set: (key: string, value: unknown) => void;
}) {
  return (
    <>
      <SectionTitle>Skill Rules</SectionTitle>
      <FieldRow label="Skill Value Soft Cap">
        <NumInput
          value={(data.maxSkillValue as number) ?? 3}
          onChange={(v) => set('maxSkillValue', v)}
        />
      </FieldRow>
      <FieldRow label="Base Skill Cost Past Soft Cap">
        <NumInput
          value={(data.baseSkillPastCapCost as number) ?? 3}
          onChange={(v) => set('baseSkillPastCapCost', v)}
        />
      </FieldRow>
      <FieldRow label="Sub-Skill Cost Past Soft Cap">
        <NumInput
          value={(data.subSkillPastCapCost as number) ?? 2}
          onChange={(v) => set('subSkillPastCapCost', v)}
        />
      </FieldRow>
      <FieldRow label="Defense Increase Cost">
        <NumInput
          value={(data.defenseIncreaseCost as number) ?? 2}
          onChange={(v) => set('defenseIncreaseCost', v)}
        />
      </FieldRow>
      <FieldRow label="Species Skill Count">
        <NumInput
          value={(data.speciesSkillCount as number) ?? 2}
          onChange={(v) => set('speciesSkillCount', v)}
        />
      </FieldRow>
      <FieldRow label="Gain Proficiency Cost">
        <NumInput
          value={(data.gainProficiencyCost as number) ?? 1}
          onChange={(v) => set('gainProficiencyCost', v)}
        />
      </FieldRow>
    </>
  );
}
