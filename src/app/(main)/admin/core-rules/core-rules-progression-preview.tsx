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
      const abilityPts = level < abilityInterval ? baseAbility : baseAbility + Math.floor(level / abilityInterval) * abilityPerIncrease;
      const skillPts = skillsPerLevel * level;
      const pool = basePool + poolPerLevel * (level - 1);
      const prof = level < profInterval ? baseProf : baseProf + Math.floor(level / profInterval) * profPerIncrease;
      const tp = baseTP + (tpMult * (level - 1));
      return { level, abilityPts, skillPts, pool, prof, tp };
    });
  }, [baseAbility, abilityInterval, abilityPerIncrease, skillsPerLevel, basePool, poolPerLevel, baseProf, profInterval, profPerIncrease, baseTP, tpMult]);

  return (
    <TableScroll className="mt-4">
      <SectionTitle>Level 1-10 Preview</SectionTitle>
      <table className="w-full text-xs">
        <thead>
          <tr className="text-text-muted dark:text-text-secondary border-b">
            <th className="text-center py-1 px-2">Lvl</th>
            <th className="text-center py-1 px-2">Ability Pts</th>
            <th className="text-center py-1 px-2">Skill Pts</th>
            <th className="text-center py-1 px-2">Health/Energy Pool</th>
            <th className="text-center py-1 px-2">Prof</th>
            <th className="text-center py-1 px-2">Training Pts</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(r => (
            <tr key={r.level} className="border-b border-border-subtle text-center">
              <td className="py-1 px-2 font-medium">{r.level}</td>
              <td className="py-1 px-2">{r.abilityPts}</td>
              <td className="py-1 px-2">{r.skillPts}</td>
              <td className="py-1 px-2">{r.pool}</td>
              <td className="py-1 px-2">{r.prof}</td>
              <td className="py-1 px-2">{r.tp}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </TableScroll>
  );
}
