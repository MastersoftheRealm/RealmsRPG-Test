import { describe, expect, it } from 'vitest';
import {
  inferEmpoweredWeaponTpFromPowerPayload,
  inferTechniqueWeaponTpFromSavedParts,
  shouldPersistCreatorWeaponId,
} from './creator-weapon-persistence';
import { bodyToColumnar, rowToItem } from './library-columnar';

describe('creator weapon persistence helpers', () => {
  it('keeps UUID weapon ids and filters default/no-attack selections', () => {
    expect(
      shouldPersistCreatorWeaponId({ weaponId: 'f5b77e37-15db-4a2d-9932-9af72d8f0fe6', allowNoAttack: false })
    ).toBe(true);
    expect(shouldPersistCreatorWeaponId({ weaponId: 0, allowNoAttack: false })).toBe(false);
    expect(shouldPersistCreatorWeaponId({ weaponId: 'no-attack', allowNoAttack: false })).toBe(false);
    expect(shouldPersistCreatorWeaponId({ weaponId: 'no-attack', allowNoAttack: true })).toBe(true);
  });

  it('infers technique weapon tp from add-weapon mechanic part', () => {
    expect(
      inferTechniqueWeaponTpFromSavedParts([
        { id: 7, name: 'Add Weapon Attack', op_1_lvl: 2 },
      ])
    ).toBe(3);
    expect(
      inferTechniqueWeaponTpFromSavedParts([
        { name: 'Add Weapon Attack', op_1_lvl: 0 },
      ])
    ).toBe(1);
    expect(inferTechniqueWeaponTpFromSavedParts([{ id: 2, name: 'Reaction' }])).toBe(0);
  });

  it('infers empowered weapon tp from add-weapon-to-power part fallback', () => {
    expect(
      inferEmpoweredWeaponTpFromPowerPayload({
        addWeaponPowerPart: { id: 369, op_1_lvl: 4 },
      })
    ).toBe(5);
    expect(
      inferEmpoweredWeaponTpFromPowerPayload({
        autoMechanics: [{ name: 'Add Weapon to Power', op_1_lvl: 1 }],
      })
    ).toBe(2);
    expect(inferEmpoweredWeaponTpFromPowerPayload(undefined)).toBe(0);
  });
});

describe('library columnar weapon mapping', () => {
  it('stores weaponName for techniques from weapon payload', () => {
    const result = bodyToColumnar('techniques', {
      name: 'Blade Flurry',
      weapon: { id: 'weapon-uuid-1', name: 'Storm Katana' },
      parts: [],
    });

    expect(result.scalars.weaponName).toBe('Storm Katana');
  });

  it('stores weaponName for empowered techniques from nested power addWeapon payload', () => {
    const result = bodyToColumnar('empowered-techniques', {
      name: 'Arc Lance',
      power: {
        addWeapon: { id: 'weapon-uuid-2', name: 'Arc Pike' },
      },
      technique: { parts: [] },
    });

    expect(result.scalars.weaponName).toBe('Arc Pike');
  });

  it('rehydrates empowered addWeapon from weaponName when payload lacks explicit addWeapon', () => {
    const mapped = rowToItem(
      'empowered-techniques',
      {
        id: 'emp-1',
        name: 'Arc Lance',
        weapon_name: 'Arc Pike',
        payload: {
          empoweredTechnique: true,
          power: { range: { steps: 2 } },
          technique: { parts: [] },
        },
      },
      'official'
    );

    expect((mapped.power as { addWeapon?: { name?: string } }).addWeapon?.name).toBe('Arc Pike');
  });
});
