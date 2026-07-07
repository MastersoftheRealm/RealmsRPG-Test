import { describe, expect, it } from 'vitest';
import {
  canCompleteEquipmentPhase,
  nextEquipmentPhase,
  prevEquipmentPhase,
  visibleEquipmentPhases,
} from '@/lib/guided-creator/equipment-phase-nav';

describe('equipment-phase-nav', () => {
  it('skips armor phase for power paths', () => {
    expect(visibleEquipmentPhases('none')).toEqual(['weapon', 'gear']);
    expect(nextEquipmentPhase('weapon', 'none')).toBe('gear');
    expect(prevEquipmentPhase('gear', 'none')).toBe('weapon');
  });

  it('includes armor for martial paths', () => {
    expect(visibleEquipmentPhases('required')).toEqual(['weapon', 'armor', 'gear']);
    expect(nextEquipmentPhase('weapon', 'required')).toBe('armor');
  });

  it('requires weapons unless unarmed prowess taken', () => {
    const ctx = {
      loadoutWeapons: [],
      loadoutArmor: [],
      recommendUnarmed: true,
      unarmedProwess: 0,
      armorMode: 'required' as const,
    };
    expect(canCompleteEquipmentPhase('weapon', ctx)).toBe(false);
    expect(
      canCompleteEquipmentPhase('weapon', { ...ctx, unarmedProwess: 1 })
    ).toBe(true);
  });
});
