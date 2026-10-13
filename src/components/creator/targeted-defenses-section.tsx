/**
 * Creator — targeted defenses multi-select (TASK-921 / TASK-925).
 * Compact ChipSelect for identity/summary chrome (not its own collapsible).
 * Asterisks name this entry’s selected parts / damage types / attack mode only.
 */

'use client';

import { useMemo } from 'react';
import { ChipSelect } from '@/components/patterns/filters';
import {
  buildTargetedDefenseSelectOptions,
  normalizeTargetedDefenses,
  type PartWithTargetedDefenses,
  type CanonicalTargetedDefense,
} from '@/lib/game/targeted-defenses';
import type { AttackMode } from '@/lib/attack-mode';

export type TargetedDefensesSectionProps = {
  selected: string[];
  onChange: (next: CanonicalTargetedDefense[]) => void;
  /** Selected creator parts only. */
  parts: PartWithTargetedDefenses[];
  /** Full parts DB for damage-type → damage-part can-target lookup. */
  partsDb?: PartWithTargetedDefenses[] | undefined;
  damageTypes?: string[] | undefined;
  attackMode?: AttackMode | undefined;
};

export function TargetedDefensesSection({
  selected,
  onChange,
  parts,
  partsDb,
  damageTypes,
  attackMode,
}: TargetedDefensesSectionProps) {
  const normalizedSelected = useMemo(() => normalizeTargetedDefenses(selected), [selected]);

  const options = useMemo(
    () =>
      buildTargetedDefenseSelectOptions({
        parts,
        partsDb,
        damageTypes,
        attackMode,
      }).map((opt) => ({
        value: opt.value,
        label: opt.label,
        chipLabel: opt.value,
      })),
    [parts, partsDb, damageTypes, attackMode],
  );

  return (
    <ChipSelect
      label="Targeted defenses (if any)"
      placeholder="Choose defenses…"
      options={options}
      selectedValues={normalizedSelected}
      onSelect={(value) => {
        const canon = normalizeTargetedDefenses([value])[0];
        if (canon && !normalizedSelected.includes(canon)) {
          onChange([...normalizedSelected, canon]);
        }
      }}
      onRemove={(value) => {
        onChange(normalizedSelected.filter((d) => d !== value));
      }}
    />
  );
}
