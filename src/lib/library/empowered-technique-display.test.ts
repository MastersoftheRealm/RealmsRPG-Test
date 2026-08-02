import { describe, expect, it } from 'vitest';
import type { PowerPart, TechniquePart } from '@/hooks/codex-types';
import {
  buildEmpoweredPowerDocument,
  buildEmpoweredTechniqueDocument,
  deriveEmpoweredTechniquePartChips,
} from './empowered-technique-display';

const frightenPart: PowerPart = {
  id: '100',
  name: 'Frighten',
  description: 'Frighten',
  category: 'Status',
  mechanic: false,
  base_en: 2,
  base_tp: 1,
  op_1_en: 0,
  op_1_tp: 0,
  percentage: false,
  duration: false,
};

const customTechniquePart: TechniquePart = {
  id: '99',
  name: 'Custom Technique Part',
  description: 'Custom Technique Part',
  category: 'Custom',
  mechanic: false,
  base_en: 1,
  base_tp: 1,
  op_1_en: 0,
  op_1_tp: 0,
  percentage: false,
};

const empoweredSample = {
  name: 'Arc Lance',
  description: 'Test empowered technique',
  empoweredTechnique: true,
  actionType: 'quick',
  isReaction: false,
  attackMode: 'weapon',
  power: {
    parts: [{ id: 100, name: 'Frighten', op_1_lvl: 0 }],
    mechanics: [],
    damage: [{ amount: 2, size: 6, type: 'fire' }],
    range: { steps: 3 },
    area: { type: 'none' },
    duration: { type: 'instant', value: 1 },
  },
  technique: {
    parts: [{ id: 99, name: 'Custom Technique Part', op_1_lvl: 0 }],
    additionalDamage: [{ amount: 1, size: 6 }],
  },
  totals: { energy: 5, trainingPoints: 2 },
};

describe('empowered-technique-display', () => {
  it('buildEmpoweredPowerDocument maps nested power payload + shared action profile', () => {
    const doc = buildEmpoweredPowerDocument(empoweredSample);
    expect(doc.actionType).toBe('quick');
    expect(doc.parts).toHaveLength(1);
    expect(doc.parts?.[0]?.name).toBe('Frighten');
    expect(doc.range?.steps).toBe(3);
  });

  it('buildEmpoweredTechniqueDocument maps nested technique payload', () => {
    const doc = buildEmpoweredTechniqueDocument(empoweredSample);
    expect(doc.parts).toHaveLength(1);
    expect(doc.parts?.[0]?.name).toBe('Custom Technique Part');
    expect(doc.damage).toEqual({ amount: 1, size: 6 });
  });

  it('deriveEmpoweredTechniquePartChips returns power + technique chips', () => {
    const chips = deriveEmpoweredTechniquePartChips(
      empoweredSample,
      [frightenPart],
      [customTechniquePart]
    );
    expect(chips.length).toBeGreaterThanOrEqual(2);
    expect(chips.some((c) => c.name.includes('Frighten'))).toBe(true);
    expect(chips.some((c) => c.name.includes('Custom Technique Part'))).toBe(true);
  });
});
