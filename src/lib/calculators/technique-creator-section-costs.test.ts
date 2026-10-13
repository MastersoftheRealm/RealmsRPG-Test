import { describe, expect, it } from 'vitest';
import type { TechniquePart } from '@/hooks/codex-types';
import { PART_IDS } from '@/lib/id-constants';
import {
  combineTechniqueCostSlices,
  isTechniqueAttackMechanicName,
  sectionAttributedEnergyRaw,
  techniqueDamageSectionCostFromAnalysis,
  techniqueManualPartsSectionCost,
  techniqueNamedBadgeCost,
  techniqueNamesEnergyRaw,
} from './technique-creator-section-costs';
import { analyzeTechniqueEnergy } from './technique-energy-breakdown';
import { calculateTechniqueCosts } from './technique-calc';

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

const weapon = part({
  id: String(PART_IDS.ADD_WEAPON_TO_TECHNIQUE),
  name: 'Add Weapon to Technique',
  base_en: 2.5,
});

const quickFree = part({
  id: String(PART_IDS.QUICK_OR_FREE_ACTION),
  name: 'Quick or Free Action',
  base_en: 1.25,
  percentage: true,
});

describe('technique creator section costs (86e3jp7e9)', () => {
  it('treats attack mechanic names separately from action type', () => {
    expect(isTechniqueAttackMechanicName('Add Weapon to Technique')).toBe(true);
    expect(isTechniqueAttackMechanicName('Quick or Free Action')).toBe(false);
  });

  it('combines weapon, action, and reaction badges for the combat header total', () => {
    const weaponSlice = calculateTechniqueCosts(
      [{ id: Number(weapon.id), name: weapon.name }],
      [weapon],
    );
    const actionSlice = calculateTechniqueCosts(
      [{ id: Number(quickFree.id), name: quickFree.name, op_1_lvl: 0 }],
      [quickFree],
    );
    const combined = combineTechniqueCostSlices(weaponSlice, actionSlice);
    expect(combined.energyRaw).toBe(weaponSlice.energyRaw + actionSlice.energyRaw);
  });

  it('gives the damage badge its share of global percentage modifiers', () => {
    const additionalDamage = part({
      id: String(PART_IDS.ADDITIONAL_DAMAGE),
      name: 'Additional Damage',
      category: 'Damage',
      base_en: 4,
      op_1_en: 1,
    });
    const decrease = part({
      id: '22',
      name: 'Situational Exploit',
      category: 'Decrease',
      base_en: 0.75,
      percentage: true,
    });
    const payload = [
      {
        id: Number(additionalDamage.id),
        name: additionalDamage.name,
        op_1_lvl: 1,
        calcSection: 'damage' as const,
      },
      {
        id: Number(decrease.id),
        name: decrease.name,
        calcSection: 'parts' as const,
      },
    ];
    const db = [additionalDamage, decrease];
    const analysis = analyzeTechniqueEnergy(payload, db);
    const damagePayload = payload.filter((p) => p.calcSection === 'damage');
    const damageBadge = techniqueDamageSectionCostFromAnalysis(analysis, damagePayload, db);
    expect(sectionAttributedEnergyRaw(analysis, 'damage')).toBeCloseTo(5 * 0.75);
    expect(damageBadge.energyRaw).toBeCloseTo(5 * 0.75);
    expect(damageBadge.energyRaw + sectionAttributedEnergyRaw(analysis, 'parts')).toBeCloseTo(
      analysis.energyRaw,
    );
  });

  it('splits Quick or Free Action and other percentages so badges sum to energyRaw', () => {
    const additionalDamage = part({
      id: String(PART_IDS.ADDITIONAL_DAMAGE),
      name: 'Additional Damage',
      category: 'Damage',
      base_en: 4,
      op_1_en: 1,
    });
    const exploit = part({
      id: '22',
      name: 'Situational Exploit',
      category: 'Decrease',
      base_en: 0.75,
      percentage: true,
    });
    const payload = [
      {
        id: Number(weapon.id),
        name: weapon.name,
        calcSection: 'attack' as const,
      },
      {
        id: Number(quickFree.id),
        name: quickFree.name,
        calcSection: 'action' as const,
      },
      {
        id: Number(additionalDamage.id),
        name: additionalDamage.name,
        op_1_lvl: 1,
        calcSection: 'damage' as const,
      },
      {
        id: Number(exploit.id),
        name: exploit.name,
        calcSection: 'parts' as const,
      },
    ];
    const db = [weapon, quickFree, additionalDamage, exploit];
    const analysis = analyzeTechniqueEnergy(payload, db);
    const product = 1.25 * 0.75;
    const attack = techniqueNamesEnergyRaw(analysis, new Set([weapon.name]));
    const action = techniqueNamedBadgeCost(
      analysis,
      new Set([quickFree.name]),
      payload.filter((row) => row.name === quickFree.name),
      db,
    );
    const damage = techniqueDamageSectionCostFromAnalysis(
      analysis,
      payload.filter((row) => row.calcSection === 'damage'),
      db,
    );
    const parts = techniqueManualPartsSectionCost(payload, db);
    const full = calculateTechniqueCosts(payload, db);

    expect(attack).toBeCloseTo(2.5 * product);
    expect(action.energyRaw).toBe(0);
    expect(damage.energyRaw).toBeCloseTo(5 * product);
    expect(parts.energyRaw).toBe(0);
    expect(attack + action.energyRaw + damage.energyRaw + parts.energyRaw).toBeCloseTo(
      full.energyRaw,
    );
    expect(full.energyRaw).toBeCloseTo(analysis.energyRaw);
  });
});
