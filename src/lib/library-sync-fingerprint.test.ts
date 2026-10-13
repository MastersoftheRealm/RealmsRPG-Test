import { describe, expect, it } from 'vitest';
import { getPowerSyncResult, sanitizePowerForSync } from './library-sync';
import type { UserPower } from '@/hooks/use-user-library';

describe('power sync fingerprint (86e3jrgjt)', () => {
  const partDef = {
    id: 12,
    name: 'Potency Increase',
    base_en: 1,
    base_tp: 0,
    op_1_desc: 'Level',
    op_1_en: 0.5,
  };

  it('flags definitions_changed when only base_en changes in the codex', () => {
    const basePower: UserPower = {
      id: 'p1',
      docId: 'p1',
      name: 'Test Power',
      parts: [{ id: 12, name: 'Potency Increase', op_1_lvl: 1 }],
    };
    const power = sanitizePowerForSync(basePower, [partDef]).value;

    const syncedAtOldBase = getPowerSyncResult(power, [partDef]);
    expect(syncedAtOldBase.issues.some((issue) => issue.code === 'definitions_changed')).toBe(
      false,
    );

    const syncedAfterBaseChange = getPowerSyncResult(power, [{ ...partDef, base_en: 2 }]);
    expect(syncedAfterBaseChange.issues.some((issue) => issue.code === 'definitions_changed')).toBe(
      true,
    );
    expect(syncedAfterBaseChange.hasDrift).toBe(true);
  });
});
