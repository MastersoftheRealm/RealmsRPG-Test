import { describe, expect, it } from 'vitest';
import {
  canCompleteEquipmentPhase,
  canNavigateToEquipmentPhase,
  nextEquipmentPhase,
  prevEquipmentPhase,
  resolveEquipmentPhaseVisibility,
  shouldShowPowerWeaponsHatch,
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

  it('keeps weapon first when options exist (entry must not land on gear)', () => {
    const visibility = resolveEquipmentPhaseVisibility('required', {
      hasWeaponOptions: true,
      hasArmorOptions: true,
      recommendUnarmed: false,
    });
    expect(visibleEquipmentPhases('required', visibility)[0]).toBe('weapon');
  });

  it('keeps weapon phase for unarmed paths without weapon options', () => {
    const visibility = resolveEquipmentPhaseVisibility('none', {
      hasWeaponOptions: false,
      hasArmorOptions: false,
      recommendUnarmed: true,
    });
    expect(visibleEquipmentPhases('none', visibility)).toEqual(['weapon', 'gear']);
  });

  it('fullCatalog always includes weapons; Power skips armor only', () => {
    const power = resolveEquipmentPhaseVisibility('none', {
      hasWeaponOptions: false,
      hasArmorOptions: false,
      recommendUnarmed: false,
      fullCatalog: true,
    });
    expect(visibleEquipmentPhases('none', power)).toEqual(['weapon', 'gear']);

    const poweredMartial = resolveEquipmentPhaseVisibility('required', {
      hasWeaponOptions: false,
      hasArmorOptions: false,
      recommendUnarmed: false,
      fullCatalog: true,
    });
    expect(visibleEquipmentPhases('required', poweredMartial)).toEqual([
      'weapon',
      'armor',
      'gear',
    ]);
  });

  it('shows the optional weapons hatch only on a Power path gear screen that skipped weapons', () => {
    expect(
      shouldShowPowerWeaponsHatch({
        archetypeType: 'power',
        includeWeapon: false,
        phase: 'gear',
        fullCatalog: false,
      })
    ).toBe(true);

    for (const context of [
      {
        archetypeType: 'martial' as const,
        includeWeapon: false,
        phase: 'gear' as const,
        fullCatalog: false,
      },
      {
        archetypeType: 'powered-martial' as const,
        includeWeapon: false,
        phase: 'gear' as const,
        fullCatalog: false,
      },
      {
        archetypeType: 'power' as const,
        includeWeapon: true,
        phase: 'gear' as const,
        fullCatalog: false,
      },
      {
        archetypeType: 'power' as const,
        includeWeapon: false,
        phase: 'weapon' as const,
        fullCatalog: false,
      },
      {
        archetypeType: 'power' as const,
        includeWeapon: false,
        phase: 'gear' as const,
        fullCatalog: true,
      },
    ]) {
      expect(shouldShowPowerWeaponsHatch(context)).toBe(false);
    }
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
