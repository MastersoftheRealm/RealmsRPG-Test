'use client';

import { useMemo } from 'react';
import { TableScroll } from '@/components/ui';
import { SectionTitle } from './core-rules-field-editors';

export function ProgressionPreview({ data }: { data: Record<string, unknown> }) {
  const baseAbility = (data.baseAbilityPoints as number) ?? 7;
  const abilityInterval = (data.abilityPointsEveryNLevels as number) ?? 3;
  const abilityPerIncrease = (data.abilityPointsPerIncrease as number) ?? 1;
  const skillsPerLevel = (data.skillPointsPerLevel as number) ?? 3;
  const basePool = (data.baseHitEnergyPool as number) ?? 18;
  const poolPerLevel = (data.hitEnergyPerLevel as number) ?? 12;
  const baseProf = (data.baseProficiency as number) ?? 2;
  const profInterval = (data.proficiencyEveryNLevels as number) ?? 5;
  const profPerIncrease = (data.proficiencyPerIncrease as number) ?? 1;
  const baseTP = (data.baseTrainingPoints as number) ?? 22;
  const tpMult = (data.tpPerLevelMultiplier as number) ?? 2;

  const rows = useMemo(() => {
    return Array.from({ length: 10 }, (_, i) => {
      const level = i + 1;
      const abilityPts =
        level < abilityInterval
          ? baseAbility
          : baseAbility + Math.floor(level / abilityInterval) * abilityPerIncrease;
      const skillPts = skillsPerLevel * level;
      const pool = basePool + poolPerLevel * (level - 1);
      const prof =
        level < profInterval
          ? baseProf
          : baseProf + Math.floor(level / profInterval) * profPerIncrease;
      const tp = baseTP + tpMult * (level - 1);
      return { level, abilityPts, skillPts, pool, prof, tp };
    });
  }, [
    baseAbility,
    abilityInterval,
    abilityPerIncrease,
    skillsPerLevel,
    basePool,
    poolPerLevel,
    baseProf,
    profInterval,
    profPerIncrease,
    baseTP,
    tpMult,
  ]);

  return (
    <TableScroll className="mt-4">
      <SectionTitle>Level 1-10 Preview</SectionTitle>
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b text-text-muted">
            <th className="px-2 py-1 text-center">Lvl</th>
            <th className="px-2 py-1 text-center">Ability Pts</th>
            <th className="px-2 py-1 text-center">Skill Pts</th>
            <th className="px-2 py-1 text-center">Health/Energy Pool</th>
            <th className="px-2 py-1 text-center">Prof</th>
            <th className="px-2 py-1 text-center">Training Pts</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.level} className="border-b border-border-subtle text-center">
              <td className="px-2 py-1 font-medium">{r.level}</td>
              <td className="px-2 py-1">{r.abilityPts}</td>
              <td className="px-2 py-1">{r.skillPts}</td>
              <td className="px-2 py-1">{r.pool}</td>
              <td className="px-2 py-1">{r.prof}</td>
              <td className="px-2 py-1">{r.tp}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </TableScroll>
  );
}
