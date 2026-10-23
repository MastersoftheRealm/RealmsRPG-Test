import { describe, expect, it } from 'vitest';
import { getCreatureSyncResult, stampCreatureSyncMeta } from './library-sync';

const weaponDamage = {
  id: 12,
  name: 'Weapon Damage',
  op_1_desc: 'Damage',
  op_1_tp: 1,
};

function creatureWithWeapon() {
  return {
    name: 'New creature',
    weapons: [
      {
        name: 'Sword',
        properties: [{ id: 12, name: 'Weapon Damage', op_1_lvl: 1 }],
      },
    ],
  };
}

describe('creature save stamps sync metadata', () => {
  it('does not flag a creature that was just saved with a weapon', () => {
    const creature = creatureWithWeapon();
    expect(getCreatureSyncResult(creature, [], [], [weaponDamage]).hasDrift).toBe(true);

    const saved = stampCreatureSyncMeta(creature, [], [], [weaponDamage]);
    const result = getCreatureSyncResult(saved, [], [], [weaponDamage]);
    expect(result.hasDrift).toBe(false);
    expect(saved.syncMeta?.dependencyFingerprint).toBeTruthy();
  });

  it('still flags a saved creature when a referenced property definition changes', () => {
    const saved = stampCreatureSyncMeta(creatureWithWeapon(), [], [], [weaponDamage]);
    const changed = { ...weaponDamage, op_1_tp: 2 };
    const result = getCreatureSyncResult(saved, [], [], [changed]);
    expect(result.hasDrift).toBe(true);
  });
});
