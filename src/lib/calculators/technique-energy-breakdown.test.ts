import { describe, expect, it } from 'vitest';
import type { TechniquePart } from '@/hooks/codex-types';
import { PART_IDS } from '@/lib/id-constants';
import { calculateTechniqueCosts } from './technique-calc';
import {
  analyzeTechniqueEnergy,
  buildTechniqueAdvancedCalculationGroups,
} from './technique-energy-breakdown';

function part(partial: Partial<TechniquePart> & Pick<TechniquePart, 'id' | 'name'>): TechniquePart {
  return {
    description: partial.name,
    category: 'Test',
    mechanic: true,
    base_en: 0,
    base_tp: 0,
    percentage: false,
    ...partial,
  };
}

const additionalDamage = part({
  id: String(PART_IDS.ADDITIONAL_DAMAGE),
  name: 'Additional Damage',
  category: 'Damage',
  base_en: 2,
  op_1_en: 1,
});

const quickFree = part({
  id: String(PART_IDS.QUICK_OR_FREE_ACTION),
  name: 'Quick or Free Action',
  category: 'Action',
  base_en: 1.25,
  op_1_en: 0.25,
  percentage: true,
});

const noAttack = part({
  id: String(PART_IDS.NO_ATTACK),
  name: 'No Attack',
  category: 'General',
  base_en: -2,
});

describe('buildTechniqueAdvancedCalculationGroups', () => {
  it('matches calculateTechniqueCosts and uses Rounded Up (not ceil)', () => {
    const payload = [
      {
        id: Number(additionalDamage.id),
        name: additionalDamage.name,
        op_1_lvl: 1,
        displayLabel: '+2d6',
        calcSection: 'damage' as const,
      },
      {
        id: Number(quickFree.id),
        name: quickFree.name,
        op_1_lvl: 1,
        displayLabel: 'Free Action',
        calcSection: 'action' as const,
      },
    ];
    const db = [additionalDamage, quickFree];
    const costs = calculateTechniqueCosts(payload, db);
    const analysis = analyzeTechniqueEnergy(payload, db);
    expect(analysis.energyRaw).toBe(costs.energyRaw);
    expect(analysis.totalEnergy).toBe(costs.totalEnergy);

    const groups = buildTechniqueAdvancedCalculationGroups(analysis);
    const text = JSON.stringify(groups);
    expect(text).not.toMatch(/ceil|floor|toFixed/i);
    expect(text).toContain('Rounded Up');
    expect(text).toContain('Free Action');
    expect(text).toContain('+50%');
    expect(text).toContain('+2d6');

    const action = groups.find((g) => g.title === 'Action Type');
    expect(action).toBeTruthy();
    const damage = groups.find((g) => g.title === 'Damage');
    expect(damage?.rows.some((r) => r.value === '3')).toBe(true);

    const combined = groups.find((g) => g.title === 'Combined Energy');
    const energyCost = combined?.rows.find((r) => r.label === 'Energy Cost');
    expect(energyCost?.value).toBe(String(costs.totalEnergy));
  });

  it('omits empty sections and shows Cannot go below 0 when clamped', () => {
    const payload = [
      {
        id: Number(noAttack.id),
        name: noAttack.name,
        calcSection: 'attack' as const,
        displayLabel: 'No Attack',
      },
    ];
    const analysis = analyzeTechniqueEnergy(payload, [noAttack]);
    const groups = buildTechniqueAdvancedCalculationGroups(analysis);
    const titles = groups.map((g) => g.title);
    expect(titles).toContain('Attack');
    expect(titles).not.toContain('Action Type');
    expect(titles).not.toContain('Damage');
    expect(titles).not.toContain('Technique Parts');

    const combined = groups.find((g) => g.title === 'Combined Energy');
    expect(combined?.rows.some((r) => r.label === 'Cannot go below 0')).toBe(true);
    expect(combined?.rows.some((r) => r.label === 'Energy Cost' && r.value === '0')).toBe(true);
  });
});
