import { describe, expect, it } from 'vitest';
import type { PowerPart } from '@/hooks/codex-types';
import { PART_IDS } from '@/lib/id-constants';
import {
  buildPowerPartsPayloadForCost,
  calculatePowerCosts,
  derivePlainPowerDisplay,
  derivePowerDisplay,
  finalizePowerEnergy,
  type PowerDocument,
} from './power-calc';
import {
  composedPowerDamage,
  composedPowerDurationLabel,
  isRandomizeDieComplete,
  normalizePowerComposition,
  formatPowerCompositionSummary,
  powerCompositionEnergyLines,
  powerCreatorSaveBlockReason,
  resolvePowerComposition,
  reverseDiscountApplied,
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

function rawEnergy(doc: PowerDocument, db: PowerPart[] = partsDb): number {
  return calculatePowerCosts(buildPowerPartsPayloadForCost(doc, db), db).energyRaw;
}

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

  it('Modify pays Shared once and each piece only for its extra parts (not overlay-sum)', () => {
    const shared = {
      actionType: 'basic' as const,
      range: { steps: 4 },
      area: { type: 'sphere' as const, level: 2 },
    };
    const freezePiece = {
      damage: d10('ice'),
      parts: [{ id: 900, name: 'Immobile' }],
      duration: { type: 'rounds' as const, value: 2 },
    };
    const chillPiece = {
      parts: [{ id: 901, name: 'Slow', op_1_lvl: 1 }],
      duration: { type: 'minutes' as const, value: 1 },
    };
    const freezeSettings: PowerDocument = { ...shared, duration: freezePiece.duration };
    const chillSettings: PowerDocument = { ...shared, duration: chillPiece.duration };
    const expected = finalizePowerEnergy(
      rawEnergy(shared) +
        (rawEnergy({ ...freezeSettings, ...freezePiece }) - rawEnergy(freezeSettings)) +
        (rawEnergy({ ...chillSettings, ...chillPiece }) - rawEnergy(chillSettings)),
    );
    const doc: PowerDocument = {
      name: 'Frost Field',
      ...shared,
      composition: {
        structure: 'modify',
        variants: [
          { id: 'freeze', label: 'Freeze', ...freezePiece },
          { id: 'chill', label: 'Chill', ...chillPiece },
        ],
      },
    };
    const res = resolvePowerComposition(doc, partsDb)!;
    expect(res.energy).toBe(expected);
    const overlaySum =
      derivePlainPowerDisplay({ ...shared, ...freezePiece }, partsDb).energy +
      derivePlainPowerDisplay({ ...shared, ...chillPiece }, partsDb).energy;
    expect(res.energy).toBeLessThan(overlaySum);
    expect(composedPowerDurationLabel(res)).toContain(' / ');
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
    const extraSlow =
      rawEnergy({
        ...shared,
        parts: [...shared.parts, { id: 901, name: 'Slow', op_1_lvl: 2 }],
        duration: { type: 'minutes', value: 1 },
      }) - rawEnergy({ ...shared, duration: { type: 'minutes', value: 1 } });
    const res = resolvePowerComposition(withSlow, partsDb)!;
    expect(res.energy).toBe(finalizePowerEnergy(rawEnergy(shared) + extraSlow));
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

  it('Randomize uses expected value: identical faces equal the effect’s normal cost', () => {
    const face: PowerDocument = {
      actionType: 'basic',
      parts: [{ id: 901, name: 'Slow' }],
    };
    const faces = Array.from({ length: 20 }, () => 'slow');
    const doc: PowerDocument = {
      name: 'Always Slow',
      composition: {
        structure: 'randomize',
        variants: [{ id: 'slow', label: 'Slow', parts: [{ id: 901, name: 'Slow' }] }],
        die: { sides: 20, faces },
      },
    };
    expect(resolvePowerComposition(doc, partsDb)!.energy).toBe(
      derivePlainPowerDisplay(face, partsDb).energy,
    );
  });

  it('Randomize 1d6 with 3 good 6 EN faces and 3 drawbacks of 4 EN is 2 EN', () => {
    const pricingDb: PowerPart[] = [...partsDb, part({ id: '910', name: 'Boost', base_en: 6 })];
    const faces = ['good', 'good', 'good', 'bad', 'bad', 'bad'];
    const doc: PowerDocument = {
      name: 'Coin Flip',
      composition: {
        structure: 'randomize',
        variants: [
          { id: 'good', label: 'Good', parts: [{ id: 910, name: 'Boost' }] },
          {
            id: 'bad',
            label: 'Bad',
            polarity: 'negative',
            parts: [{ id: 902, name: 'Blinded' }],
          },
        ],
        die: { sides: 6, faces },
      },
    };
    expect(resolvePowerComposition(doc, pricingDb)!.energy).toBe(2);
  });

  it('Randomize d20 with 19 faces of a 10 EN effect and 1 drawback of 50 EN is 9 EN', () => {
    const pricingDb: PowerPart[] = [
      ...partsDb,
      part({ id: '911', name: 'Ten', base_en: 10 }),
      part({ id: '912', name: 'Fifty', base_en: 50 }),
    ];
    const faces = [...Array.from({ length: 19 }, () => 'good'), 'bad'];
    const doc: PowerDocument = {
      name: 'Nearly Always Ten',
      composition: {
        structure: 'randomize',
        variants: [
          { id: 'good', label: 'Good', parts: [{ id: 911, name: 'Ten' }] },
          {
            id: 'bad',
            label: 'Bad',
            polarity: 'negative',
            parts: [{ id: 912, name: 'Fifty' }],
          },
        ],
        die: { sides: 20, faces },
      },
    };
    expect(resolvePowerComposition(doc, pricingDb)!.energy).toBe(9);
  });

  it('Randomize applies speed premiums only to good faces (free-action premium is not skipped)', () => {
    const pricingDb: PowerPart[] = [
      ...partsDb,
      part({
        id: String(PART_IDS.POWER_QUICK_OR_FREE_ACTION),
        name: 'Power Quick or Free Action',
        mechanic: true,
        percentage: true,
        base_en: 1.25,
        op_1_en: 0.25,
      }),
      part({ id: '910', name: 'Boost', base_en: 6 }),
    ];
    const faces = ['good', 'good', 'good', 'bad', 'bad', 'bad'];
    const doc: PowerDocument = {
      name: 'Free Coin Flip',
      actionType: 'free',
      composition: {
        structure: 'randomize',
        variants: [
          { id: 'good', label: 'Good', parts: [{ id: 910, name: 'Boost' }] },
          {
            id: 'bad',
            label: 'Bad',
            polarity: 'negative',
            parts: [{ id: 902, name: 'Blinded' }],
          },
        ],
        die: { sides: 6, faces },
      },
    };
    // Good overlay at free = 6 × 1.5 = 9; extra vs empty shared 0. Bad at basic = 4.
    // 0.5·9 − 0.5·½·4 = 4.5 − 1 = 3.5 → 4 EN. Without the premium it would be 2.
    expect(resolvePowerComposition(doc, pricingDb)!.energy).toBe(4);
  });

  it('Randomize expected value is cheaper than the old signed-face sum', () => {
    const chassis = { actionType: 'basic' as const, range: { steps: 1 } };
    const doc: PowerDocument = {
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
        die: { sides: 4, faces: ['slow', 'slow', 'slow', 'blind'] },
      },
    };
    const mixed = resolvePowerComposition(doc, partsDb)!;
    const sharedRaw = rawEnergy(chassis);
    const extraGood = rawEnergy({ ...chassis, parts: [{ id: 901, name: 'Slow' }] }) - sharedRaw;
    const badRaw = rawEnergy({
      actionType: 'basic',
      isReaction: false,
      parts: [{ id: 902, name: 'Blinded' }],
    });
    expect(mixed.energy).toBe(
      finalizePowerEnergy(sharedRaw + (3 * extraGood) / 4 - (0.5 * badRaw) / 4),
    );
    expect(mixed.variants.find((v) => v.id === 'slow')?.faces).toEqual([1, 2, 3]);
    const allNegative = resolvePowerComposition(
      {
        ...doc,
        composition: {
          ...doc.composition!,
          die: { sides: 4, faces: ['blind', 'blind', 'blind', 'blind'] },
        },
      },
      partsDb,
    )!;
    expect(allNegative.energy).toBe(1);
    expect(mixed.selectedVariantId).toBeNull();
  });

  it('Modify official Freezing Wind is 33 EN (Shared once, Slow extra at 1 minute)', () => {
    const officialDb: PowerPart[] = [
      part({
        id: String(PART_IDS.ELEMENTAL_DAMAGE),
        name: 'Elemental Damage',
        category: 'Damage',
        mechanic: true,
        base_en: 3,
        op_1_en: 1,
      }),
      part({
        id: String(PART_IDS.POWER_RANGE),
        name: 'Power Range',
        mechanic: true,
        base_en: 0.5,
        op_1_en: 0.5,
      }),
      part({
        id: String(PART_IDS.SPHERE_OF_EFFECT),
        name: 'Sphere of Effect',
        category: 'Area of Effect',
        mechanic: true,
        percentage: true,
        base_en: 1.25,
        op_1_en: 0.25,
      }),
      part({
        id: String(PART_IDS.DURATION_ROUND),
        name: 'Duration (Round)',
        category: 'Duration',
        mechanic: true,
        duration: true,
        base_en: 0.125,
        op_1_en: 0.125,
      }),
      part({
        id: String(PART_IDS.DURATION_MINUTE),
        name: 'Duration (Minute)',
        category: 'Duration',
        mechanic: true,
        duration: true,
        base_en: 0.75,
        op_1_en: 0.75,
      }),
      part({ id: '340', name: 'Restrained', base_en: 6 }),
      part({ id: '329', name: 'Slow', base_en: 2, op_1_en: 2 }),
    ];
    const doc: PowerDocument = {
      name: 'Freezing Wind',
      actionType: 'basic',
      range: { steps: 2 },
      area: { type: 'sphere', level: 2, applyDuration: false },
      duration: { type: 'rounds', value: 2 },
      damage: [{ amount: 1, size: 8, type: 'ice', applyDuration: false }],
      parts: [{ id: 340, name: 'Restrained', applyDuration: true }],
      composition: {
        structure: 'modify',
        variants: [
          {
            id: 'v2',
            label: 'Slow 3 (1 Minute)',
            range: { steps: 2 },
            area: { type: 'sphere', level: 2, applyDuration: false },
            duration: { type: 'minutes', value: 1 },
            parts: [{ id: 329, name: 'Slow', op_1_lvl: 2, applyDuration: true }],
          },
        ],
      },
    };
    expect(resolvePowerComposition(doc, officialDb)!.energy).toBe(33);
    const pricedAsOneMinute = derivePlainPowerDisplay(
      {
        actionType: 'basic',
        range: { steps: 2 },
        area: { type: 'sphere', level: 2, applyDuration: false },
        duration: { type: 'minutes', value: 1 },
        damage: [{ amount: 1, size: 8, type: 'ice', applyDuration: false }],
        parts: [
          { id: 340, name: 'Restrained', applyDuration: true },
          { id: 329, name: 'Slow', op_1_lvl: 2, applyDuration: true },
        ],
      },
      officialDb,
    ).energy;
    expect(pricedAsOneMinute).toBe(36);
  });

  it('floors final Energy at 1 when Reverse would drop it to 0 (86e3kfkbv)', () => {
    const res = resolvePowerComposition(
      {
        name: 'Daze',
        actionType: 'basic',
        parts: [{ id: 901, name: 'Slow' }],
        composition: {
          structure: 'none',
          variants: [],
          reverse: {
            parts: [
              { id: 902, name: 'Blinded' },
              { id: 900, name: 'Immobile' },
            ],
          },
        },
      },
      partsDb,
    )!;
    expect(res.reverse?.energy).toBeGreaterThan(res.structureEnergy * 2);
    expect(res.energy).toBe(1);
    const applied = reverseDiscountApplied(res);
    expect(applied.limitedByFloor).toBe(true);
    expect(applied.applied).toBe(res.energyBeforeReverse - 1);
    expect(powerCompositionEnergyLines(res).some((line) => line.includes('1 EN floor'))).toBe(true);
    const summary = formatPowerCompositionSummary(res);
    expect(summary).toContain(`Reverse −${applied.applied} EN`);
    expect(summary).not.toContain(`Reverse −${res.reverse!.discount}`);
  });

  it('Modify damage lists Shared once, then each piece’s own rows (86e3kfkbt)', () => {
    const sharedDmg = [{ amount: 1, size: 6, type: 'fire' }];
    const res = resolvePowerComposition(
      {
        name: 'QA MT 18',
        actionType: 'basic',
        damage: sharedDmg,
        composition: {
          structure: 'modify',
          variants: [
            { id: 'v1', label: 'Range only', range: { steps: 2 } },
            { id: 'v2', label: 'Empty' },
          ],
        },
      },
      partsDb,
    )!;
    expect(composedPowerDamage(res)).toEqual(sharedDmg);

    const mixed = resolvePowerComposition(
      {
        name: 'QA PC126 Modify',
        actionType: 'basic',
        damage: [{ amount: 1, size: 4, type: 'fire' }],
        composition: {
          structure: 'modify',
          variants: [
            { id: 'a', label: 'A', damage: [{ amount: 1, size: 6, type: 'fire' }] },
            { id: 'b', label: 'B', damage: [{ amount: 1, size: 8, type: 'ice' }] },
            { id: 'c', label: 'C', damage: [{ amount: 1, size: 4, type: 'acid' }] },
          ],
        },
      },
      partsDb,
    )!;
    expect(composedPowerDamage(mixed)).toEqual([
      { amount: 1, size: 4, type: 'fire' },
      { amount: 1, size: 6, type: 'fire' },
      { amount: 1, size: 8, type: 'ice' },
      { amount: 1, size: 4, type: 'acid' },
    ]);
  });

  it('Modify rolls Shared damage together with each piece (review: 2d10 fire + 1d4 ice)', () => {
    const res = resolvePowerComposition(
      {
        name: 'Shared plus piece',
        actionType: 'basic',
        damage: [{ amount: 2, size: 10, type: 'fire' }],
        composition: {
          structure: 'modify',
          variants: [{ id: 'ice', label: 'Ice', damage: [{ amount: 1, size: 4, type: 'ice' }] }],
        },
      },
      partsDb,
    )!;
    expect(composedPowerDamage(res)).toEqual([
      { amount: 2, size: 10, type: 'fire' },
      { amount: 1, size: 4, type: 'ice' },
    ]);
  });

  it('Randomize does not pick outcome A until a face is selected (86e3kfkc0)', () => {
    const doc: PowerDocument = {
      name: 'Wild',
      actionType: 'basic',
      damage: [{ amount: 1, size: 4, type: 'magic' }],
      composition: {
        structure: 'randomize',
        variants: [
          { id: 'a', label: 'Out A', damage: [{ amount: 1, size: 6, type: 'fire' }] },
          { id: 'b', label: 'Out B', damage: [{ amount: 2, size: 6, type: 'lightning' }] },
        ],
        die: { sides: 2, faces: ['a', 'b'] },
      },
    };
    const unread = resolvePowerComposition(doc, partsDb)!;
    expect(unread.selectedVariantId).toBeNull();
    expect(composedPowerDamage(unread)).toEqual([{ amount: 1, size: 4, type: 'magic' }]);
    const rolled = resolvePowerComposition(doc, partsDb, { selectedVariantId: 'b' })!;
    expect(rolled.selectedVariantId).toBe('b');
    expect(composedPowerDamage(rolled)).toEqual([{ amount: 2, size: 6, type: 'lightning' }]);

    const badDoc: PowerDocument = {
      ...doc,
      composition: {
        structure: 'randomize',
        variants: [
          { id: 'a', label: 'Out A', damage: [{ amount: 1, size: 6, type: 'fire' }] },
          {
            id: 'b',
            label: 'Out B',
            polarity: 'negative',
            damage: [{ amount: 1, size: 4, type: 'poison' }],
          },
        ],
        die: { sides: 2, faces: ['a', 'b'] },
      },
    };
    const bad = resolvePowerComposition(badDoc, partsDb, { selectedVariantId: 'b' })!;
    expect(composedPowerDamage(bad)).toEqual([
      { amount: 1, size: 4, type: 'magic' },
      { amount: 1, size: 4, type: 'poison' },
    ]);
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

  it('a good Randomize face cheaper than Shared shows its negative contribution', () => {
    const pricingDb: PowerPart[] = [
      ...partsDb,
      part({
        id: String(PART_IDS.POWER_QUICK_OR_FREE_ACTION),
        name: 'Power Quick or Free Action',
        mechanic: true,
        percentage: true,
        base_en: 1.25,
        op_1_en: 0.25,
      }),
      part({ id: '910', name: 'Boost', base_en: 6 }),
    ];
    const res = resolvePowerComposition(
      {
        name: 'Cheaper face',
        actionType: 'free',
        parts: [{ id: 910, name: 'Boost' }],
        composition: {
          structure: 'randomize',
          variants: [
            { id: 'cheap', label: 'Basic', actionType: 'basic', isReaction: false },
            {
              id: 'bad',
              label: 'Bad',
              polarity: 'negative',
              parts: [{ id: 902, name: 'Blinded' }],
            },
          ],
          die: { sides: 2, faces: ['cheap', 'bad'] },
        },
      },
      pricingDb,
    )!;
    // Shared at free = 6 × 1.5 = 9. Basic overlay = 6. Contribution = −3, not +0.
    expect(res.variants.find((v) => v.id === 'cheap')?.energy).toBe(-3);
    // Blinded is 4 EN; the face lists half (−2), not the full −4.
    expect(res.variants.find((v) => v.id === 'bad')?.energy).toBe(-2);
    expect(res.energy).toBeLessThan(9);
  });

  it('Randomize breakdown shows raw Shared and the halved drawback (not the 1 EN floor)', () => {
    const res = resolvePowerComposition(
      {
        name: 'Empty chassis',
        actionType: 'basic',
        composition: {
          structure: 'randomize',
          variants: [
            { id: 'good', label: 'Good', parts: [{ id: 901, name: 'Slow' }] },
            {
              id: 'bad',
              label: 'Bad',
              polarity: 'negative',
              parts: [{ id: 902, name: 'Blinded' }],
            },
          ],
          die: { sides: 2, faces: ['good', 'bad'] },
        },
      },
      partsDb,
    )!;
    const lines = powerCompositionEnergyLines(res);
    expect(lines[0]).toBe('Shared chassis: 0 EN');
    expect(lines.some((line) => line.startsWith('Bad: −2 EN'))).toBe(true);
    expect(lines.some((line) => line.includes('−4'))).toBe(false);
    expect(res.shared?.display.energy).toBe(0);
  });

  it('an empty power publishes no energy (the 1 EN floor needs a costed part)', () => {
    expect(derivePlainPowerDisplay({ name: 'Blank', actionType: 'basic' }, partsDb).energy).toBe(0);
    const composed = resolvePowerComposition(
      {
        name: 'Blank choice',
        actionType: 'basic',
        composition: { structure: 'choice', variants: [] },
      },
      partsDb,
    )!;
    expect(composed.energy).toBe(0);
    expect(powerCompositionEnergyLines(composed).at(-1)).toBe('Choice total: —');
  });

  it('official-shaped Elemental Burst is 8 EN; damage without range is 6', () => {
    const liveDb: PowerPart[] = [
      part({
        id: String(PART_IDS.ELEMENTAL_DAMAGE),
        name: 'Elemental Damage',
        category: 'Damage',
        mechanic: true,
        base_en: 3,
        op_1_en: 1,
      }),
      part({
        id: String(PART_IDS.POWER_RANGE),
        name: 'Power Range',
        mechanic: true,
        base_en: 0.5,
        op_1_en: 0.5,
      }),
    ];
    const variants = [
      { id: 'fire', label: 'Fire', damage: d10('fire') },
      { id: 'ice', label: 'Ice', damage: d10('ice') },
      { id: 'lightning', label: 'Lightning', damage: d10('lightning') },
    ];
    const withRange = resolvePowerComposition(
      {
        name: 'Elemental Burst',
        actionType: 'basic',
        range: { steps: 3 },
        composition: { structure: 'choice', variants },
      },
      liveDb,
    )!;
    const damageOnly = resolvePowerComposition(
      {
        name: 'Elemental Burst',
        actionType: 'basic',
        composition: { structure: 'choice', variants },
      },
      liveDb,
    )!;
    // 9 spaces (3 steps) is 1.5 EN. 1d10 is 6 EN. 7.5 rounds up to 8.
    expect(withRange.energy).toBe(8);
    expect(damageOnly.energy).toBe(6);
  });

  it('names the Randomize save block when a variant has no face', () => {
    const reason = powerCreatorSaveBlockReason({
      composition: {
        structure: 'randomize',
        variants: [
          { id: 'a', label: 'Alt A' },
          { id: 'b', label: 'Alt B' },
        ],
        die: { sides: 2, faces: ['a', 'a'] },
      },
    });
    expect(reason).toContain('Alt B has no die face');
    expect(
      powerCreatorSaveBlockReason({
        composition: { structure: 'alternate', variants: [{ id: 'a', label: 'A' }] },
      }),
    ).toBeNull();
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

  it('treats a Randomize variant with no faces as incomplete (86e3kfkc6)', () => {
    expect(
      isRandomizeDieComplete({
        structure: 'randomize',
        variants: [
          { id: 'a', label: 'A' },
          { id: 'b', label: 'B' },
          { id: 'c', label: 'C' },
        ],
        die: { sides: 2, faces: ['a', 'b'] },
      }),
    ).toBe(false);
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
