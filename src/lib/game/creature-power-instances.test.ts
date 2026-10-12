import { describe, expect, it } from 'vitest';
import {
  assignCreaturePowerInstance,
  creaturePowerRowKey,
  removeCreaturePowerByRowKey,
  toggleCreaturePowerInnateByRowKey,
  type CreaturePowerInstanceRow,
} from './creature-power-instances';

function power(
  partial: CreaturePowerInstanceRow & { name?: string; tp?: number },
): CreaturePowerInstanceRow & {
  name: string;
  tp?: number;
} {
  return { name: 'P', ...partial };
}

describe('creature power instances (86e3jx636)', () => {
  it('assigns instanceId and preserves library id as sourceId', () => {
    const base = power({ id: 'lib-1', name: 'QA CR Power 1', tp: 1 });
    const a = assignCreaturePowerInstance(base);
    const b = assignCreaturePowerInstance(base);
    expect(a.sourceId).toBe('lib-1');
    expect(b.sourceId).toBe('lib-1');
    expect(a.instanceId).toBeTruthy();
    expect(b.instanceId).toBeTruthy();
    expect(a.instanceId).not.toBe(b.instanceId);
  });

  it('removes only one row when legacy duplicates share a library id', () => {
    const rows = [
      power({ id: 'lib-1', name: 'P1', tp: 1 }),
      power({ id: 'lib-1', name: 'P1', tp: 1 }),
      power({ id: 'lib-1', name: 'P1', tp: 1 }),
      power({ id: 'lib-4', name: 'P4', tp: 4 }),
    ];
    const key = creaturePowerRowKey(rows[2], 2);
    const next = removeCreaturePowerByRowKey(rows, key);
    expect(next).toHaveLength(3);
    expect(next.filter((p) => p.id === 'lib-1')).toHaveLength(2);
    expect(next[2].id).toBe('lib-4');
  });

  it('toggles innate on a single instance', () => {
    const withInstance = assignCreaturePowerInstance(power({ id: 'lib-1', name: 'P1' }));
    const rows = [withInstance, { ...withInstance, instanceId: 'other' }];
    const key = creaturePowerRowKey(rows[0], 0);
    const next = toggleCreaturePowerInnateByRowKey(rows, key);
    expect(next[0].innate).toBe(true);
    expect(next[1].innate).not.toBe(true);
  });
});
