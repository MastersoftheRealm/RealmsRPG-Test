import { describe, expect, it } from 'vitest';
import { getCreatureSyncResult, sanitizeCreatureForSync } from '@/lib/library-sync';
import {
  publishedPowerTrainingPoints,
  publishedTechniqueTrainingPoints,
} from './published-training-points';

const powerRange = {
  id: 383,
  name: 'Power Range',
  mechanic: true,
  base_tp: 0.5,
  op_1_tp: 0.5,
  op_1_desc: 'Range',
};

const additionalDamage = {
  id: 6,
  name: 'Additional Damage',
  base_tp: 1,
  op_1_tp: 0.5,
  op_1_desc: 'Damage',
};

describe('published training points ignore a stale stored total', () => {
  it('prices Power Range from Codex rates (0.5 per level used at 3 needs level 4)', () => {
    const published = publishedPowerTrainingPoints(
      {
        name: 'Bolt',
        tp: 1,
        parts: [],
        range: { steps: 4 },
        actionType: 'basic',
      },
      [powerRange],
    );
    expect(published.priced).toBe(true);
    expect(published.tp).toBe(3);
    expect(published.tp).not.toBe(1);
  });

  it('prices a technique option from Codex rates instead of the saved total', () => {
    const published = publishedTechniqueTrainingPoints(
      {
        name: 'Strike',
        tp: 1,
        parts: [{ id: 6, name: 'Additional Damage', op_1_lvl: 1 }],
      },
      [additionalDamage],
    );
    expect(published.priced).toBe(true);
    expect(published.tp).toBe(2);
  });

  it('keeps the saved total when the part cannot be priced', () => {
    const published = publishedPowerTrainingPoints(
      { name: 'Custom', tp: 4, parts: [{ id: 99, name: 'Missing' }] },
      [powerRange],
    );
    expect(published.priced).toBe(false);
    expect(published.tp).toBe(4);
  });
});

describe('creature sync rewrites stored Training Points', () => {
  const creature = {
    id: 'c1',
    name: 'Caster',
    powers: [
      {
        id: 'bolt',
        name: 'Bolt',
        tp: 1,
        parts: [] as [],
        rangeValue: { steps: 4 },
        actionType: 'basic',
      },
    ],
    techniques: [
      {
        id: 'strike',
        name: 'Strike',
        tp: 1,
        parts: [{ id: 6, name: 'Additional Damage', op_1_lvl: 1 }],
      },
    ],
  };

  it('flags a saved creature whose power and technique totals are behind the current rates', () => {
    const result = getCreatureSyncResult(creature, [powerRange], [additionalDamage], []);
    expect(result.hasDrift).toBe(true);
    expect(result.changed).toBe(true);
    expect(result.value.powers?.[0]?.tp).toBe(3);
    expect(result.value.techniques?.[0]?.tp).toBe(2);
    expect(result.issues.some((issue) => issue.message.includes('Training Points'))).toBe(true);
  });

  it('writes the live totals when the creature is synced', () => {
    const saved = sanitizeCreatureForSync(creature, [powerRange], [additionalDamage], []);
    expect(saved.value.powers?.[0]?.tp).toBe(3);
    expect(saved.value.techniques?.[0]?.tp).toBe(2);
    const again = getCreatureSyncResult(saved.value, [powerRange], [additionalDamage], []);
    expect(again.value.powers?.[0]?.tp).toBe(3);
    expect(again.issues.some((issue) => issue.message.includes('Training Points'))).toBe(false);
  });
});
