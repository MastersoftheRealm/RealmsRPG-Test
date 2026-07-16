import { describe, expect, it } from 'vitest';
import {
  canCompleteEquipmentPhase,
  canNavigateToEquipmentPhase,
  nextEquipmentPhase,
  prevEquipmentPhase,
  resolveEquipmentPhaseVisibility,
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

  it('allows zero weapon/armor/Equipment picks (optional phases)', () => {
    const ctx = {
      loadoutWeapons: [],
      loadoutArmor: [],
      recommendUnarmed: false,
      unarmedProwess: 0,
      armorMode: 'required' as const,
    };
    expect(canCompleteEquipmentPhase('weapon', ctx)).toBe(true);
    expect(canCompleteEquipmentPhase('armor', ctx)).toBe(true);
    expect(canCompleteEquipmentPhase('gear', ctx)).toBe(true);
  });

  it('omits weapon and armor when path has no options', () => {
    const visibility = resolveEquipmentPhaseVisibility('required', {
      hasWeaponOptions: false,
      hasArmorOptions: false,
      recommendUnarmed: false,
    });
    expect(visibleEquipmentPhases('required', visibility)).toEqual(['gear']);
  });

  it('keeps weapon phase for unarmed paths without weapon options', () => {
    const visibility = resolveEquipmentPhaseVisibility('none', {
      hasWeaponOptions: false,
      hasArmorOptions: false,
      recommendUnarmed: true,
    });
    expect(visibleEquipmentPhases('none', visibility)).toEqual(['weapon', 'gear']);
  });

  it('allows advancing to the next phase with zero selections', () => {
    const ctx = {
      loadoutWeapons: [],
      loadoutArmor: [],
      recommendUnarmed: false,
      unarmedProwess: 0,
      armorMode: 'required' as const,
    };
    expect(canNavigateToEquipmentPhase('armor', 'weapon', 'required', ctx)).toBe(true);
    expect(canNavigateToEquipmentPhase('gear', 'armor', 'required', ctx)).toBe(true);
  });
});
