import { describe, expect, it } from 'vitest';
import type { PowerPart } from '@/hooks/codex-types';
import { PART_IDS } from '@/lib/id-constants';
import { derivePlainPowerDisplay, derivePowerDisplay, type PowerDocument } from './power-calc';
import {
  composedPowerDamage,
  composedPowerDurationLabel,
  isRandomizeDieComplete,
  normalizePowerComposition,
  resolvePowerComposition,
} from './power-composition';

function part(p: Partial<PowerPart> & Pick<PowerPart, 'id' | 'name'>): PowerPart {
  return {
    description: p.name,
    category: 'General',
    mechanic: false,
    base_en: 0,
    base_tp: 0,
    percentage: false,
    duration: false,
    ...p,
  };
}

const partsDb: PowerPart[] = [
  part({
    id: String(PART_IDS.ELEMENTAL_DAMAGE),
    name: 'Elemental Damage',
    category: 'Damage',
    mechanic: true,
    base_en: 3,
    op_1_en: 1,
    base_tp: 2,
    op_1_tp: 0.5,
  }),
  part({
    id: String(PART_IDS.POWER_RANGE),
    name: 'Power Range',
    mechanic: true,
    base_en: 1,
    op_1_en: 1,
    base_tp: 1,
  }),
  part({
    id: String(PART_IDS.SPHERE_OF_EFFECT),
    name: 'Sphere of Effect',
    category: 'Area of Effect',
    mechanic: true,
    base_en: 2,
    op_1_en: 1,
    base_tp: 1,
  }),
  part({
    id: String(PART_IDS.DURATION_ROUND),
    name: 'Duration (Round)',
    category: 'Duration',
    mechanic: true,
    duration: true,
    base_en: 1.5,
    op_1_en: 0.25,
  }),
  part({
    id: String(PART_IDS.DURATION_MINUTE),
    name: 'Duration (Minute)',
    category: 'Duration',
    mechanic: true,
    duration: true,
    base_en: 2,
  }),
  part({ id: '900', name: 'Immobile', base_en: 4, base_tp: 1 }),
  part({ id: '901', name: 'Slow', base_en: 2, op_1_en: 1, base_tp: 1 }),
  part({ id: '902', name: 'Blinded', base_en: 4 }),
  part({ id: String(PART_IDS.POWER_CHOICE), name: 'Choice', mechanic: true, op_1_en: -1 }),
];

const d10 = (type: string) => [{ amount: 1, size: 10, type }];

describe('resolvePowerComposition', () => {
  it('leaves a normal power unchanged', () => {
    const doc: PowerDocument = {
      name: 'Bolt',
      actionType: 'basic',
      range: { steps: 3 },
      damage: d10('fire'),
    };
    expect(resolvePowerComposition(doc, partsDb)).toBeNull();
    expect(derivePowerDisplay(doc, partsDb)).toEqual(derivePlainPowerDisplay(doc, partsDb));
  });

  it('Choice (Elemental Burst) costs the same as a single-element bolt of the same range', () => {
    const bolt = derivePlainPowerDisplay(
      { name: 'Fire Bolt', actionType: 'basic', range: { steps: 3 }, damage: d10('fire') },
      partsDb,
    );
    const burst: PowerDocument = {
      name: 'Elemental Burst',
      actionType: 'basic',
      range: { steps: 3 },
      // Legacy Choice part must not also discount a composed power.
      parts: [{ id: PART_IDS.POWER_CHOICE, name: 'Choice', op_1_lvl: 12 }],
      composition: {
        structure: 'choice',
        variants: [
          { id: 'fire', label: 'Fire', damage: d10('fire') },
          { id: 'ice', label: 'Ice', damage: d10('ice') },
          { id: 'lightning', label: 'Lightning', damage: d10('lightning') },
        ],
      },
    };
    const res = resolvePowerComposition(burst, partsDb, { selectedVariantId: 'ice' })!;
    expect(res.energy).toBe(bolt.energy);
    expect(composedPowerDamage(res)).toEqual(d10('ice'));
    // Range once (1) + Elemental Damage split by type: fire, ice, lightning (floor 3.5 = 3 each).
    expect(res.tp).toBe(1 + 3 * 3);
    expect(res.tpSources.filter((s) => s.includes('Power Range'))).toHaveLength(1);
  });

  it('Modify (ice power) equals Freeze priced alone plus Chill priced alone', () => {
    const shared = { actionType: 'basic', range: { steps: 4 }, area: { type: 'sphere', level: 2 } };
    const freeze: PowerDocument = {
      ...shared,
      damage: d10('ice'),
      parts: [{ id: 900, name: 'Immobile' }],
      duration: { type: 'rounds', value: 2 },
    };
    const chill: PowerDocument = {
      ...shared,
      parts: [{ id: 901, name: 'Slow', op_1_lvl: 1 }],
      duration: { type: 'minutes', value: 1 },
    };
    const expected =
      derivePlainPowerDisplay(freeze, partsDb).energy +
      derivePlainPowerDisplay(chill, partsDb).energy;
    const doc: PowerDocument = {
      name: 'Frost Field',
      ...shared,
      composition: {
        structure: 'modify',
        variants: [
          {
            id: 'freeze',
            label: 'Freeze',
            damage: d10('ice'),
            parts: [{ id: 900, name: 'Immobile' }],
            duration: { type: 'rounds', value: 2 },
          },
          {
            id: 'chill',
            label: 'Chill',
            parts: [{ id: 901, name: 'Slow', op_1_lvl: 1 }],
            duration: { type: 'minutes', value: 1 },
          },
        ],
      },
    };
    const res = resolvePowerComposition(doc, partsDb)!;
    expect(res.energy).toBe(expected);
    expect(composedPowerDurationLabel(res)).toContain(' / ');
    // Power Range and Sphere are charged once, not once per piece.
    expect(res.tpSources.filter((s) => s.includes('Power Range'))).toHaveLength(1);
    expect(res.tpSources.filter((s) => s.includes('Sphere of Effect'))).toHaveLength(1);
  });

  it('Modify does not charge empty pieces, so two blank tabs do not double Shared', () => {
    const shared = {
      actionType: 'basic' as const,
      range: { steps: 2 },
      area: { type: 'sphere' as const, level: 2 },
      duration: { type: 'rounds' as const, value: 2 },
      parts: [{ id: 910, name: 'Restrained' }],
    };
    const base = derivePlainPowerDisplay(shared, partsDb).energy;
    const blank: PowerDocument = {
      name: 'Freezing Wind',
      ...shared,
      composition: {
        structure: 'modify',
        variants: [
          { id: 'v1', label: 'Variant 1' },
          { id: 'v2', label: 'Variant 2' },
        ],
      },
    };
    expect(resolvePowerComposition(blank, partsDb)!.energy).toBe(base);

    const withSlow: PowerDocument = {
      ...blank,
      composition: {
        structure: 'modify',
        variants: [
          { id: 'v1', label: 'Variant 1' },
          {
            id: 'v2',
            label: 'Slow',
            parts: [{ id: 901, name: 'Slow', op_1_lvl: 2 }],
            duration: { type: 'minutes', value: 1 },
          },
        ],
      },
    };
    const piece = derivePlainPowerDisplay(
      {
        ...shared,
        parts: [...shared.parts, { id: 901, name: 'Slow', op_1_lvl: 2 }],
        duration: { type: 'minutes', value: 1 },
      },
      partsDb,
    ).energy;
    const res = resolvePowerComposition(withSlow, partsDb)!;
    expect(res.energy).toBe(piece);
    expect(res.variants.find((v) => v.id === 'v1')!.energy).toBe(0);
  });

  it('Alternate pays the selected variant, including a cheaper one', () => {
    const doc: PowerDocument = {
      name: 'Flame',
      composition: {
        structure: 'alternate',
        variants: [
          {
            id: 'big',
            label: 'Inferno',
            actionType: 'basic',
            range: { steps: 4 },
            damage: [{ amount: 3, size: 10, type: 'fire' }],
          },
          {
            id: 'small',
            label: 'Spark',
            actionType: 'basic',
            damage: [{ amount: 1, size: 6, type: 'fire' }],
          },
        ],
      },
    };
    const big = resolvePowerComposition(doc, partsDb)!;
    const small = resolvePowerComposition(doc, partsDb, { selectedVariantId: 'small' })!;
    expect(big.selectedVariantId).toBe('big');
    expect(small.energy).toBeLessThan(big.energy);
    expect(small.energy).toBe(
      derivePlainPowerDisplay(
        { actionType: 'basic', damage: [{ amount: 1, size: 6, type: 'fire' }] },
        partsDb,
      ).energy,
    );
  });

  it('Randomize counts repeated faces and signs, then adds the chassis', () => {
    const chassis = { actionType: 'basic', range: { steps: 1 } };
    const chassisEnergy = derivePlainPowerDisplay(chassis, partsDb).energy;
    const doc = (faces: string[]): PowerDocument => ({
      name: 'Wild Surge',
      ...chassis,
      composition: {
        structure: 'randomize',
        variants: [
          { id: 'slow', label: 'Slow', parts: [{ id: 901, name: 'Slow' }] },
          {
            id: 'blind',
            label: 'Blinded',
            polarity: 'negative',
            parts: [{ id: 902, name: 'Blinded' }],
          },
        ],
        die: { sides: 4, faces },
      },
    });
    // Three positive 2-energy faces and one negative 4-energy face = 2 before chassis.
    const mixed = resolvePowerComposition(doc(['slow', 'slow', 'slow', 'blind']), partsDb)!;
    expect(mixed.energy).toBe(chassisEnergy + 2);
    expect(mixed.variants.find((v) => v.id === 'slow')?.faces).toEqual([1, 2, 3]);
    const allNegative = resolvePowerComposition(
      doc(['blind', 'blind', 'blind', 'blind']),
      partsDb,
    )!;
    expect(allNegative.energy).toBe(1);
  });

  it('Reverse subtracts 50% of the drawback energy', () => {
    const base: PowerDocument = { name: 'Ward', actionType: 'basic', range: { steps: 3 } };
    const plain = derivePlainPowerDisplay(base, partsDb).energy;
    const res = resolvePowerComposition(
      {
        ...base,
        composition: {
          structure: 'none',
          variants: [],
          reverse: { parts: [{ id: 902, name: 'Blinded' }] },
        },
      },
      partsDb,
    )!;
    expect(res.reverse?.energy).toBe(4);
    expect(res.energy).toBe(Math.ceil(plain - 2));
  });
});

describe('normalizePowerComposition', () => {
  it('drops plain structures and pads die faces', () => {
    expect(normalizePowerComposition({ structure: 'none', variants: [] })).toBeNull();
    const c = normalizePowerComposition({
      structure: 'randomize',
      variants: [{ id: 'a', label: 'A' }],
      die: { sides: 2, faces: ['a'] },
    })!;
    expect(c.die?.faces).toEqual(['a', '']);
    expect(isRandomizeDieComplete(c)).toBe(false);
  });

  it('keeps an Alternate variant attack mode for the creator round-trip', () => {
    const c = normalizePowerComposition({
      structure: 'alternate',
      variants: [
        { id: 'a', label: 'A', attackMode: 'weapon' },
        { id: 'b', label: 'B', attackMode: 'bogus' },
      ],
    })!;
    expect(c.variants[0]?.attackMode).toBe('weapon');
    expect(c.variants[1]?.attackMode).toBeUndefined();
  });
});
