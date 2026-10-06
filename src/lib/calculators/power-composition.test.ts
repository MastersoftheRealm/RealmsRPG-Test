import { describe, expect, it } from 'vitest';
import type { PowerPart } from '@/hooks/codex-types';
import { PART_IDS } from '@/lib/id-constants';
import {
  buildPowerPartsPayloadForCost,
  calculatePowerCosts,
  derivePlainPowerDisplay,
  derivePowerDisplay,
  finalizePowerEnergy,
  formatPowerRangeFromSteps,
  type PowerDocument,
} from './power-calc';
import { buildPowerVariantChips, withPowerReverseNote } from '@/lib/power-variant-chips';
import { loadRepoCodexParts, snapshotParts } from './power-composition.fixture';
import {
  composedPowerDamage,
  composedPowerDurationLabel,
  isRandomizeDieComplete,
  normalizePowerComposition,
  drawbackReductionForAction,
  formatEnergyIntermediate,
  reverseActionDivisorNote,
  formatPowerCompositionSummary,
  powerCompositionHelpText,
  powerCompositionEnergyLines,
  powerCreatorSaveBlockReason,
  resolvePowerComposition,
  reverseDiscountApplied,
  type PowerVariant,
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

/** Real Codex ids come from the snapshot. 900+ are synthetic and are not Codex rows. */
const partsDb: PowerPart[] = [
  ...snapshotParts([
    PART_IDS.ELEMENTAL_DAMAGE,
    PART_IDS.POWER_RANGE,
    PART_IDS.SPHERE_OF_EFFECT,
    PART_IDS.DURATION_ROUND,
    PART_IDS.DURATION_MINUTE,
    PART_IDS.POWER_CHOICE,
    PART_IDS.POWER_QUICK_OR_FREE_ACTION,
    PART_IDS.POWER_LONG_ACTION,
  ]),
  part({ id: '900', name: 'Immobile', base_en: 4, base_tp: 1 }),
  part({ id: '901', name: 'Slow', base_en: 2, op_1_en: 1, base_tp: 1 }),
  part({ id: '902', name: 'Blinded', base_en: 4 }),
];

const d10 = (type: string) => [{ amount: 1, size: 10, type }];

/** A saved independent face always stores these, including when they are empty. */
function independentFace(spec: PowerVariant): PowerVariant {
  return {
    range: { steps: 0 },
    area: { type: 'none' as const, level: 1 },
    duration: { type: 'instant' as const, value: 1 },
    damage: [],
    ...spec,
  };
}

function rawEnergy(doc: PowerDocument, db: PowerPart[] = partsDb): number {
  return calculatePowerCosts(buildPowerPartsPayloadForCost(doc, db), db).energyRaw;
}

describe('resolvePowerComposition', () => {
  it('loads real Codex part ids from the snapshot', () => {
    const range = partsDb.find((row) => row.id === String(PART_IDS.POWER_RANGE));
    const sphere = partsDb.find((row) => row.id === String(PART_IDS.SPHERE_OF_EFFECT));
    expect(range?.base_en).toBe(0.5);
    expect(range?.op_1_en).toBe(0.5);
    expect(sphere?.percentage).toBe(true);
    expect(sphere?.base_en).toBe(1.25);
    expect(sphere?.op_1_en).toBe(0.25);
  });

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
    // Power Range at 3 steps: base 0.5 + option 1, each rounded up → 2. Each 1d10: base 2 + option 1.5, each rounded up → 4.
    expect(res.tp).toBe(2 + 3 * 4);
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
    // Snapshot Sphere of Effect is 0 TP, so it is not a training-point source.
    expect(res.tpSources.filter((s) => s.includes('Sphere of Effect'))).toHaveLength(0);
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
    const pricingDb: PowerPart[] = [...partsDb, part({ id: '910', name: 'Boost', base_en: 6 })];
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
    // Good face at free = 6 × 1.5 = 9, weight 1/2 → 4.5.
    // Bad reduction = ½ · 4 ÷ 1.5 ≈ 1.333, weight 1/2 → 0.667. 4.5 − 0.667 = 3.833 → 4 EN.
    expect(resolvePowerComposition(doc, pricingDb)!.energy).toBe(4);
  });

  it('includes Reaction in the drawback divisor for bad faces and Reverse', () => {
    const db: PowerPart[] = [
      ...snapshotParts([PART_IDS.POWER_REACTION, PART_IDS.POWER_QUICK_OR_FREE_ACTION]),
      part({ id: '920', name: 'Drawback', base_en: 4 }),
      part({ id: '921', name: 'Benefit', base_en: 20 }),
    ];
    const priced = (isReaction: boolean) =>
      resolvePowerComposition(
        {
          name: 'Harm',
          actionType: 'free',
          isReaction,
          parts: [{ id: 921, name: 'Benefit' }],
          composition: {
            structure: 'none',
            variants: [],
            reverse: { parts: [{ id: 920, name: 'Drawback' }] },
          },
        },
        db,
      )!;
    const free = priced(false);
    const reaction = priced(true);
    expect(free.reverse?.actionMultiplier).toBeCloseTo(1.5);
    expect(reaction.reverse?.actionMultiplier).toBeCloseTo(1.5 * 1.25);
    expect(reaction.reverse?.discount).toBeCloseTo(2 / (1.5 * 1.25));
    expect(reaction.reverse!.discount).toBeLessThan(free.reverse!.discount);

    const bad = (isReaction: boolean) =>
      resolvePowerComposition(
        {
          name: 'Wild',
          actionType: 'free',
          isReaction,
          composition: {
            structure: 'randomize',
            variants: [
              {
                id: 'bad',
                label: 'Bad',
                polarity: 'negative',
                parts: [{ id: 920, name: 'Drawback' }],
              },
            ],
            die: { sides: 2, faces: ['bad', 'bad'] },
          },
        },
        db,
      )!;
    expect(bad(true).structureEnergy).toBeCloseTo(-(2 / (1.5 * 1.25)));
    expect(bad(true).structureEnergy).toBeGreaterThan(bad(false).structureEnergy);
  });

  it('prices a free-action 20/80 Randomize from snapshot parts, faces independent', () => {
    const db = loadRepoCodexParts();
    const stun = { id: 341, name: 'Stun', op_1_lvl: 2 };
    const buffParts = [
      { id: 307, name: 'Heal' },
      { id: 235, name: 'Add Multiple Targets', op_1_lvl: 1 },
    ];
    const buffRange = { steps: 1 };
    const buffArea = { type: 'sphere' as const, level: 1 };
    const doc: PowerDocument = {
      name: 'Wild Buff',
      actionType: 'free',
      parts: [{ id: 317, name: 'Regenerate' }],
      range: { steps: 4 },
      composition: {
        structure: 'randomize',
        variants: [
          independentFace({
            id: 'bad',
            label: 'Stunned 3',
            polarity: 'negative',
            parts: [stun],
          }),
          independentFace({
            id: 'good',
            label: 'Buff three allies',
            parts: buffParts,
            range: buffRange,
            area: buffArea,
          }),
        ],
        die: {
          sides: 10,
          faces: ['bad', 'bad', 'good', 'good', 'good', 'good', 'good', 'good', 'good', 'good'],
        },
      },
    };
    const res = resolvePowerComposition(doc, db)!;
    const good = res.variants.find((v) => v.id === 'good')!;
    const bad = res.variants.find((v) => v.id === 'bad')!;
    const goodAlone = rawEnergy(
      { actionType: 'free', parts: buffParts, range: buffRange, area: buffArea },
      db,
    );
    const stunBasic = rawEnergy({ actionType: 'basic', isReaction: false, parts: [stun] }, db);
    expect(stunBasic).toBeCloseTo(15);
    expect(good.energyRaw).toBeCloseTo(goodAlone);
    expect(good.doc.actionType).toBe('free');
    expect(bad.doc.range).toEqual({ steps: 0 });
    expect(bad.doc.area).toEqual({ type: 'none', level: 1 });
    expect(bad.energyRaw).toBeCloseTo(-drawbackReductionForAction(stunBasic, 1.5));
    expect(bad.energyRaw).toBeCloseTo(-5);
    expect(res.shared!.rawEnergy).toBeGreaterThan(good.energyRaw);
    expect(res.structureEnergy).toBeCloseTo(good.energyRaw * 0.8 + bad.energyRaw * 0.2);
    expect(res.energy).toBe(finalizePowerEnergy(res.structureEnergy, true));
    const stunWithBuffFootprint = rawEnergy(
      { actionType: 'basic', parts: [stun], range: buffRange, area: buffArea },
      db,
    );
    expect(stunBasic).toBeLessThan(stunWithBuffFootprint);
  });

  it('Randomize expected value is cheaper than the old signed-face sum', () => {
    const chassis = { actionType: 'basic' as const, range: { steps: 1 } };
    const doc: PowerDocument = {
      name: 'Wild Surge',
      ...chassis,
      composition: {
        structure: 'randomize',
        variants: [
          independentFace({ id: 'slow', label: 'Slow', parts: [{ id: 901, name: 'Slow' }] }),
          independentFace({
            id: 'blind',
            label: 'Blinded',
            polarity: 'negative',
            parts: [{ id: 902, name: 'Blinded' }],
          }),
        ],
        die: { sides: 4, faces: ['slow', 'slow', 'slow', 'blind'] },
      },
    };
    const mixed = resolvePowerComposition(doc, partsDb)!;
    const goodRaw = rawEnergy({ actionType: 'basic', parts: [{ id: 901, name: 'Slow' }] });
    const badRaw = rawEnergy({
      actionType: 'basic',
      isReaction: false,
      parts: [{ id: 902, name: 'Blinded' }],
    });
    expect(mixed.structureEnergy).toBeCloseTo((3 * goodRaw) / 4 - (0.5 * badRaw) / 4);
    expect(mixed.energy).toBe(finalizePowerEnergy(mixed.structureEnergy, true));
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
    expect(allNegative.energy).toBe(0);
    expect(mixed.selectedVariantId).toBeNull();
  });

  it('an empty Randomize chassis with only bad faces publishes a dash', () => {
    const res = resolvePowerComposition(
      {
        name: 'Only bad',
        actionType: 'basic',
        composition: {
          structure: 'randomize',
          variants: [
            {
              id: 'bad',
              label: 'Bad',
              polarity: 'negative',
              parts: [{ id: 902, name: 'Blinded' }],
            },
          ],
          die: { sides: 2, faces: ['bad', 'bad'] },
        },
      },
      partsDb,
    )!;
    expect(res.energy).toBe(0);
    expect(powerCompositionEnergyLines(res).at(-1)).toBe('Randomize total: —');
  });

  it('Modify official Freezing Wind is Shared once plus the Slow piece, from the Codex snapshot', () => {
    const officialDb = loadRepoCodexParts();
    const slow = officialDb.find((row) => row.id === '329');
    expect(slow?.base_en).toBe(2);
    expect(slow?.op_1_en).toBe(2);
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
    const resolved = resolvePowerComposition(doc, officialDb)!;
    const sharedOnly = rawEnergy(
      {
        actionType: 'basic',
        range: doc.range,
        area: doc.area,
        duration: doc.duration,
        damage: doc.damage,
        parts: doc.parts,
      },
      officialDb,
    );
    const pieceFoot: PowerDocument = {
      actionType: 'basic',
      range: { steps: 2 },
      area: doc.area,
      duration: { type: 'minutes', value: 1 },
      parts: [{ id: 329, name: 'Slow', op_1_lvl: 2, applyDuration: true }],
    };
    const emptyWithRange = rawEnergy({ ...pieceFoot, parts: [] }, officialDb);
    const emptyWithoutRange = rawEnergy(
      { ...pieceFoot, parts: [], range: { steps: 0 } },
      officialDb,
    );
    const partsOnly = rawEnergy(pieceFoot, officialDb) - emptyWithRange;
    const fullRange = emptyWithRange - emptyWithoutRange;
    expect(fullRange).toBeGreaterThan(0);
    expect(resolved.variants[0]!.rangeEnergy).toBeCloseTo(fullRange);
    expect(resolved.variants[0]!.energyRaw).toBeCloseTo(partsOnly + fullRange);
    expect(resolved.energy).toBe(finalizePowerEnergy(sharedOnly + partsOnly + fullRange, true));
    expect(resolved.energy).toBe(34);
    expect(powerCompositionEnergyLines(resolved)).toContain(
      `Slow 3 (1 Minute) range (${formatPowerRangeFromSteps(2)}): ${formatEnergyIntermediate(fullRange)} EN`,
    );
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
    expect(pricedAsOneMinute).not.toBe(resolved.energy);
  });

  it('a tab with no range of its own adds 0 range cost, from the Codex snapshot', () => {
    const officialDb = loadRepoCodexParts();
    const sphere = { type: 'sphere' as const, level: 2, applyDuration: false };
    const slow = [{ id: 329, name: 'Slow', op_1_lvl: 2, applyDuration: true }];
    const minute = { type: 'minutes' as const, value: 1 };
    const shared = {
      name: 'Freezing Wind',
      actionType: 'basic' as const,
      range: { steps: 2 },
      area: sphere,
      duration: { type: 'rounds' as const, value: 2 },
      damage: [{ amount: 1, size: 8, type: 'ice', applyDuration: false }],
      parts: [{ id: 340, name: 'Restrained', applyDuration: true }],
    };
    const inheritedFoot: PowerDocument = {
      actionType: 'basic',
      range: shared.range,
      area: sphere,
      duration: minute,
      parts: slow,
    };
    const partsOnly =
      rawEnergy(inheritedFoot, officialDb) - rawEnergy({ ...inheritedFoot, parts: [] }, officialDb);
    const sharedRangeCost =
      rawEnergy({ ...inheritedFoot, parts: [] }, officialDb) -
      rawEnergy({ ...inheritedFoot, parts: [], range: { steps: 0 } }, officialDb);
    expect(sharedRangeCost).toBeGreaterThan(0);
    expect(partsOnly).toBeGreaterThan(0);

    const omitted = resolvePowerComposition(
      {
        ...shared,
        composition: {
          structure: 'modify',
          variants: [
            { id: 'v2', label: 'Slow 3 (1 Minute)', area: sphere, duration: minute, parts: slow },
            { id: 'blank', label: 'Blank' },
          ],
        },
      },
      officialDb,
    )!;
    const slowPiece = omitted.variants.find((v) => v.id === 'v2')!;
    expect(slowPiece.rangeEnergy).toBe(0);
    expect(slowPiece.energyRaw).toBeCloseTo(partsOnly);
    expect(slowPiece.energyRaw).not.toBeCloseTo(partsOnly - sharedRangeCost);
    expect(omitted.variants.find((v) => v.id === 'blank')!.rangeEnergy).toBe(0);
    expect(omitted.variants.find((v) => v.id === 'blank')!.energyRaw).toBe(0);
    const omittedLines = powerCompositionEnergyLines(omitted);
    expect(omittedLines.some((line) => line.includes('refund') || line.includes('−'))).toBe(false);
    expect(omittedLines.some((line) => line.includes(' range'))).toBe(false);

    const choice = resolvePowerComposition(
      {
        ...shared,
        composition: {
          structure: 'choice',
          variants: [
            { id: 'near', label: 'Near', area: sphere, duration: minute, parts: slow },
            { id: 'other', label: 'Other', parts: [{ id: 340, name: 'Restrained' }] },
          ],
        },
      },
      officialDb,
    )!;
    expect(choice.variants.find((v) => v.id === 'near')!.rangeEnergy).toBe(0);
    expect(choice.variants.find((v) => v.id === 'near')!.energyRaw).toBeCloseTo(partsOnly);

    const reverse = resolvePowerComposition(
      {
        ...shared,
        composition: {
          structure: 'none',
          variants: [],
          reverse: { area: sphere, duration: minute, parts: slow },
        },
      },
      officialDb,
    )!;
    expect(reverse.reverse!.rangeEnergy).toBe(0);
    expect(reverse.reverse!.rawEnergy).toBeCloseTo(partsOnly);
    expect(withPowerReverseNote(undefined, reverse)).not.toContain('refund');
    expect(powerCompositionEnergyLines(reverse).some((line) => line.includes('refund'))).toBe(
      false,
    );
  });

  it('a tab that adds its own range pays that range in full, from the Codex snapshot', () => {
    const officialDb = loadRepoCodexParts();
    const sphere = { type: 'sphere' as const, level: 2, applyDuration: false };
    const noArea = { type: 'none' as const, level: 1 };
    const slow = [{ id: 329, name: 'Slow', op_1_lvl: 2, applyDuration: true }];
    const minute = { type: 'minutes' as const, value: 1 };
    const shared = {
      name: 'Freezing Wind',
      actionType: 'basic' as const,
      range: { steps: 2 },
      area: sphere,
      duration: { type: 'rounds' as const, value: 2 },
      damage: [{ amount: 1, size: 8, type: 'ice', applyDuration: false }],
      parts: [{ id: 340, name: 'Restrained', applyDuration: true }],
    };
    const fullRange = (
      steps: number,
      actionType: 'basic' | 'quick',
      area: { type: string; level: number; applyDuration?: boolean },
    ) =>
      rawEnergy({ actionType, range: { steps }, area, duration: minute }, officialDb) -
      rawEnergy({ actionType, range: { steps: 0 }, area, duration: minute }, officialDb);
    const differenceFromShared = (
      steps: number,
      actionType: 'basic' | 'quick',
      area: { type: string; level: number; applyDuration?: boolean },
    ) =>
      rawEnergy({ actionType, range: { steps }, area, duration: minute }, officialDb) -
      rawEnergy({ actionType, range: shared.range, area, duration: minute }, officialDb);
    const piece = (
      steps: number,
      actionType: 'basic' | 'quick' = 'basic',
      area: { type: string; level: number; applyDuration?: boolean } = sphere,
    ) =>
      resolvePowerComposition(
        {
          ...shared,
          actionType,
          composition: {
            structure: 'modify',
            variants: [
              {
                id: 'v2',
                label: 'Slow 3 (1 Minute)',
                range: { steps },
                area,
                duration: minute,
                parts: slow,
              },
              { id: 'blank', label: 'Blank' },
            ],
          },
        },
        officialDb,
      )!;

    const shorter = piece(1);
    const shorterRange = fullRange(1, 'basic', sphere);
    const shorterDiff = differenceFromShared(1, 'basic', sphere);
    expect(shorterDiff).toBeLessThan(0);
    expect(shorter.variants[0]!.rangeEnergy).toBeCloseTo(shorterRange);
    expect(shorter.variants[0]!.rangeEnergy).toBeGreaterThan(0);
    expect(shorter.variants[0]!.rangeEnergy).not.toBeCloseTo(shorterDiff);
    const shorterParts =
      rawEnergy(
        { actionType: 'basic', range: { steps: 1 }, area: sphere, duration: minute, parts: slow },
        officialDb,
      ) -
      rawEnergy(
        { actionType: 'basic', range: { steps: 1 }, area: sphere, duration: minute },
        officialDb,
      );
    expect(shorter.variants[0]!.energyRaw).toBeCloseTo(shorterParts + shorterRange);
    const shorterLine = `Slow 3 (1 Minute) range (${formatPowerRangeFromSteps(1)}): ${formatEnergyIntermediate(shorterRange)} EN`;
    expect(powerCompositionEnergyLines(shorter)).toContain(shorterLine);
    expect(powerCompositionEnergyLines(shorter).some((line) => line.includes('refund'))).toBe(
      false,
    );
    expect(shorterLine).not.toContain('−');
    const shorterChip = buildPowerVariantChips(shorter).find(
      (chip) => chip.name === 'Slow 3 (1 Minute)',
    );
    expect(shorterChip?.description).toContain(
      `Range (${formatPowerRangeFromSteps(1)}): ${formatEnergyIntermediate(shorterRange)} EN`,
    );
    expect(shorterChip?.description).not.toContain('refund');

    const longer = piece(4);
    const longerRange = fullRange(4, 'basic', sphere);
    expect(longer.variants[0]!.rangeEnergy).toBeCloseTo(longerRange);
    expect(longer.variants[0]!.rangeEnergy).not.toBeCloseTo(
      differenceFromShared(4, 'basic', sphere),
    );
    expect(longerRange).toBeGreaterThan(differenceFromShared(4, 'basic', sphere));

    const matching = piece(2);
    expect(matching.variants[0]!.rangeEnergy).toBeCloseTo(fullRange(2, 'basic', sphere));
    expect(differenceFromShared(2, 'basic', sphere)).toBeCloseTo(0);
    expect(matching.variants[0]!.rangeEnergy).toBeGreaterThan(0);

    const quick = piece(1, 'quick');
    expect(quick.variants[0]!.rangeEnergy).toBeCloseTo(fullRange(1, 'quick', sphere));
    expect(quick.variants[0]!.rangeEnergy).not.toBeCloseTo(
      differenceFromShared(1, 'quick', sphere),
    );
    const quickNoArea = piece(1, 'quick', noArea);
    expect(quickNoArea.variants[0]!.rangeEnergy).toBeCloseTo(fullRange(1, 'quick', noArea));
    expect(quickNoArea.variants[0]!.rangeEnergy).not.toBeCloseTo(fullRange(1, 'quick', sphere));

    const choice = resolvePowerComposition(
      {
        ...shared,
        composition: {
          structure: 'choice',
          variants: [
            {
              id: 'near',
              label: 'Near',
              range: { steps: 1 },
              area: sphere,
              duration: minute,
              parts: slow,
            },
            { id: 'other', label: 'Other', parts: [{ id: 340, name: 'Restrained' }] },
          ],
        },
      },
      officialDb,
    )!;
    expect(choice.variants.find((v) => v.id === 'near')!.rangeEnergy).toBeCloseTo(shorterRange);
    expect(choice.variants.find((v) => v.id === 'other')!.rangeEnergy).toBe(0);

    const reverse = resolvePowerComposition(
      {
        ...shared,
        composition: {
          structure: 'none',
          variants: [],
          reverse: { range: { steps: 1 }, area: sphere, duration: minute, parts: slow },
        },
      },
      officialDb,
    )!;
    expect(reverse.reverse!.rangeEnergy).toBeCloseTo(shorterRange);
    expect(reverse.reverse!.rawEnergy).toBeCloseTo(shorterParts + shorterRange);
    expect(reverse.reverse!.rangeEnergy).not.toBeCloseTo(shorterDiff);
    const reverseLines = powerCompositionEnergyLines(reverse);
    expect(reverseLines).toContain(
      `Reverse range (${formatPowerRangeFromSteps(1)}): ${formatEnergyIntermediate(shorterRange)} EN`,
    );
    expect(reverseLines.some((line) => line.includes('refund'))).toBe(false);
    expect(withPowerReverseNote(undefined, reverse)).toContain(
      `Range (${formatPowerRangeFromSteps(1)}): ${formatEnergyIntermediate(shorterRange)} EN`,
    );
    expect(withPowerReverseNote(undefined, reverse)).not.toContain('refund');

    for (const key of ['modify', 'choice', 'reverse'] as const) {
      expect(powerCompositionHelpText(key)).toContain('There is no refund for a shorter range.');
    }
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
    expect(composedPowerDamage(unread)).toEqual([]);
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
    expect(composedPowerDamage(bad)).toEqual([{ amount: 1, size: 4, type: 'poison' }]);
  });

  it('Reverse help states the inverse rule, not the stale codex sentence', () => {
    const help = powerCompositionHelpText('reverse');
    expect(help).toMatch(/divided by the action-type multiplier/);
    expect(help).toMatch(/slower action removes more/);
    expect(help).not.toMatch(/50% the energy/);
  });

  it('Reverse on a basic action subtracts half the drawback energy', () => {
    const base: PowerDocument = { name: 'Ward', actionType: 'basic', range: { steps: 3 } };
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
    expect(res.reverse?.rawEnergy).toBeCloseTo(4);
    expect(res.reverse?.discount).toBeCloseTo(2);
    expect(res.energy).toBe(finalizePowerEnergy(rawEnergy(base) - 2, true));
  });

  it('a Randomize face does not pay for Shared parts or another face’s range', () => {
    const pricingDb: PowerPart[] = [...partsDb, part({ id: '910', name: 'Boost', base_en: 6 })];
    const res = resolvePowerComposition(
      {
        name: 'Independent faces',
        actionType: 'free',
        parts: [{ id: 910, name: 'Boost' }],
        range: { steps: 3 },
        composition: {
          structure: 'randomize',
          variants: [
            independentFace({ id: 'plain', label: 'Plain', parts: [{ id: 901, name: 'Slow' }] }),
            independentFace({
              id: 'bad',
              label: 'Bad',
              polarity: 'negative',
              range: { steps: 1 },
              parts: [{ id: 902, name: 'Blinded' }],
            }),
          ],
          die: { sides: 2, faces: ['plain', 'bad'] },
        },
      },
      pricingDb,
    )!;
    const plain = res.variants.find((v) => v.id === 'plain')!;
    const bad = res.variants.find((v) => v.id === 'bad')!;
    expect(plain.energyRaw).toBeCloseTo(
      rawEnergy({ actionType: 'free', parts: [{ id: 901, name: 'Slow' }] }, pricingDb),
    );
    expect(plain.energyRaw).toBeLessThan(res.shared?.rawEnergy ?? 0);
    expect(bad.doc.range).toEqual({ steps: 1 });
    expect(bad.energyRaw).toBeCloseTo(
      -drawbackReductionForAction(
        rawEnergy(
          {
            actionType: 'basic',
            isReaction: false,
            range: { steps: 1 },
            parts: [{ id: 902, name: 'Blinded' }],
          },
          pricingDb,
        ),
        1.5,
      ),
    );
    expect(res.structureEnergy).toBeCloseTo((plain.energyRaw + bad.energyRaw) / 2);
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
    expect(lines[0]).toBe('Shared: not priced');
    expect(lines.some((line) => line.startsWith('Shared chassis'))).toBe(false);
    expect(lines.some((line) => line.startsWith('Bad: −2 EN'))).toBe(true);
    expect(lines.some((line) => line.includes('−4'))).toBe(false);
    expect(res.shared?.display.energy).toBe(0);
  });

  it('an empty power publishes no energy until positive energy exists', () => {
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

  it('official Choice chips show Shared plus that option, from the Codex snapshot', () => {
    const liveDb = loadRepoCodexParts();
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
    expect(withRange.shared?.rawEnergy).toBeGreaterThan(0);
    expect(withRange.energy).toBe(
      finalizePowerEnergy(
        (withRange.shared?.rawEnergy ?? 0) +
          Math.max(...withRange.variants.map((v) => v.energyRaw)),
        true,
      ),
    );
    expect(damageOnly.energy).toBe(
      finalizePowerEnergy(
        (damageOnly.shared?.rawEnergy ?? 0) +
          Math.max(...damageOnly.variants.map((v) => v.energyRaw)),
        true,
      ),
    );
    expect(withRange.energy).toBe(8);
    expect(withRange.energy).toBeGreaterThan(damageOnly.energy);
    const lines = powerCompositionEnergyLines(withRange);
    expect(lines[0]).toBe(`Shared: ${formatEnergyIntermediate(withRange.shared!.rawEnergy)} EN`);
    expect(lines.some((line) => line.startsWith('Choice pays the most expensive portion'))).toBe(
      true,
    );
    const chips = buildPowerVariantChips(withRange);
    expect(chips).toHaveLength(3);
    for (const [index, chip] of chips.entries()) {
      expect(chip.description?.startsWith(`${withRange.variants[index]!.energy} Energy`)).toBe(
        true,
      );
      expect(withRange.variants[index]!.energy).toBe(
        finalizePowerEnergy(
          (withRange.shared?.rawEnergy ?? 0) + withRange.variants[index]!.energyRaw,
        ),
      );
    }
    expect(new Set(withRange.variants.map((v) => v.energy))).toEqual(new Set([withRange.energy]));

    const bolt = resolvePowerComposition(
      {
        name: 'Elemental Bolt',
        actionType: 'basic',
        range: { steps: 4 },
        composition: {
          structure: 'choice',
          variants: ['fire', 'ice', 'lightning'].map((type) => ({
            id: type,
            label: type,
            damage: [{ amount: 1, size: 6, type }],
          })),
        },
      },
      liveDb,
    )!;
    const boltChips = buildPowerVariantChips(bolt);
    expect(boltChips).toHaveLength(3);
    for (const [index, chip] of boltChips.entries()) {
      expect(chip.description?.startsWith(`${bolt.variants[index]!.energy} Energy`)).toBe(true);
    }
    expect(new Set(bolt.variants.map((v) => v.energy))).toEqual(new Set([bolt.energy]));
    expect(bolt.energy).toBe(6);
    expect(bolt.energy).toBe(
      finalizePowerEnergy(
        (bolt.shared?.rawEnergy ?? 0) + Math.max(...bolt.variants.map((v) => v.energyRaw)),
        true,
      ),
    );
  });

  it('Modify prices a single-target Daze piece without Shared’s sphere', () => {
    const db = [...partsDb, part({ id: '940', name: 'Synthetic Daze', base_en: 4 })];
    const shared: PowerDocument = {
      name: 'Ice Field',
      actionType: 'basic',
      range: { steps: 2 },
      area: { type: 'sphere', level: 2 },
      damage: [{ amount: 1, size: 8, type: 'ice' }],
      parts: [{ id: 901, name: 'Slow' }],
    };
    const pieceDuration = { type: 'minutes' as const, value: 1 };
    const pieceFoot: PowerDocument = {
      actionType: 'basic',
      range: shared.range,
      duration: pieceDuration,
      parts: [{ id: 940, name: 'Synthetic Daze' }],
    };
    const extra = rawEnergy(pieceFoot, db) - rawEnergy({ ...pieceFoot, parts: [] }, db);
    const insideSphere =
      rawEnergy({ ...pieceFoot, area: shared.area }, db) -
      rawEnergy({ ...pieceFoot, parts: [], area: shared.area }, db);
    expect(extra).toBeLessThan(insideSphere);
    const res = resolvePowerComposition(
      {
        ...shared,
        composition: {
          structure: 'modify',
          variants: [
            {
              id: 'daze',
              label: 'Daze',
              area: { type: 'none', level: 1 },
              duration: pieceDuration,
              parts: [{ id: 940, name: 'Synthetic Daze' }],
            },
          ],
        },
      },
      db,
    )!;
    expect(res.variants[0]!.energyRaw).toBeCloseTo(extra);
    expect(res.energy).toBe(finalizePowerEnergy(rawEnergy(shared, db) + extra, true));
  });

  it('Modify charges a bigger area only on that piece’s parts', () => {
    const db = partsDb;
    const shared: PowerDocument = {
      name: 'Reach',
      actionType: 'basic',
      range: { steps: 1 },
      parts: [{ id: 900, name: 'Immobile' }],
    };
    const pieceArea = { type: 'sphere' as const, level: 2 };
    const foot: PowerDocument = {
      actionType: 'basic',
      range: shared.range,
      area: pieceArea,
      parts: [{ id: 901, name: 'Slow' }],
    };
    const extra = rawEnergy(foot, db) - rawEnergy({ ...foot, parts: [] }, db);
    const fullOverlay = rawEnergy(
      {
        ...shared,
        area: pieceArea,
        parts: [...(shared.parts ?? []), { id: 901, name: 'Slow' }],
      },
      db,
    );
    expect(rawEnergy(shared, db) + extra).toBeLessThan(fullOverlay);
    const res = resolvePowerComposition(
      {
        ...shared,
        composition: {
          structure: 'modify',
          variants: [
            { id: 'slow', label: 'Slow', area: pieceArea, parts: [{ id: 901, name: 'Slow' }] },
          ],
        },
      },
      db,
    )!;
    expect(res.variants[0]!.energyRaw).toBeCloseTo(extra);
    expect(res.energy).toBe(finalizePowerEnergy(rawEnergy(shared, db) + extra, true));
  });

  it('Choice prices a longer, wider portion at that portion’s footprint', () => {
    const db = partsDb;
    const shared: PowerDocument = {
      name: 'Choice Reach',
      actionType: 'basic',
      range: { steps: 1 },
      area: { type: 'sphere', level: 1 },
      parts: [{ id: 900, name: 'Immobile' }],
    };
    const optionRange = { steps: 3 };
    const optionArea = { type: 'sphere' as const, level: 2 };
    const foot: PowerDocument = {
      actionType: 'basic',
      range: optionRange,
      area: optionArea,
      parts: [{ id: 902, name: 'Blinded' }],
    };
    const partsEnergy = rawEnergy(foot, db) - rawEnergy({ ...foot, parts: [] }, db);
    const fullRange =
      rawEnergy({ ...foot, parts: [] }, db) -
      rawEnergy({ ...foot, parts: [], range: { steps: 0 } }, db);
    const differenceFromShared =
      rawEnergy({ ...foot, parts: [] }, db) -
      rawEnergy({ ...foot, parts: [], range: shared.range }, db);
    expect(fullRange).toBeGreaterThan(differenceFromShared);
    const extra = partsEnergy + fullRange;
    const fullOverlay = rawEnergy(
      {
        ...shared,
        range: optionRange,
        area: optionArea,
        parts: [...(shared.parts ?? []), { id: 902, name: 'Blinded' }],
      },
      db,
    );
    expect(rawEnergy(shared, db) + extra).not.toBeCloseTo(fullOverlay);
    const res = resolvePowerComposition(
      {
        ...shared,
        composition: {
          structure: 'choice',
          variants: [
            {
              id: 'far',
              label: 'Far',
              range: optionRange,
              area: optionArea,
              parts: [{ id: 902, name: 'Blinded' }],
            },
          ],
        },
      },
      db,
    )!;
    expect(res.variants[0]!.energyRaw).toBeCloseTo(extra);
    expect(res.energy).toBe(finalizePowerEnergy(rawEnergy(shared, db) + extra, true));
  });

  it('Randomize and Alternate do not add a second range charge', () => {
    const db = partsDb;
    const immobile = [{ id: 900, name: 'Immobile' }];
    const randomize = resolvePowerComposition(
      {
        name: 'Own range',
        actionType: 'basic',
        range: { steps: 3 },
        parts: immobile,
        composition: {
          structure: 'randomize',
          variants: [
            independentFace({
              id: 'near',
              label: 'Near',
              range: { steps: 1 },
              parts: [{ id: 902, name: 'Blinded' }],
            }),
          ],
          die: { sides: 2, faces: ['near', 'near'] },
        },
      },
      db,
    )!;
    expect(randomize.variants[0]!.rangeEnergy).toBe(0);
    expect(randomize.variants[0]!.energyRaw).toBeCloseTo(
      rawEnergy(
        { actionType: 'basic', range: { steps: 1 }, parts: [{ id: 902, name: 'Blinded' }] },
        db,
      ),
    );
    expect(powerCompositionEnergyLines(randomize).some((line) => line.includes('refund'))).toBe(
      false,
    );

    const alternateDoc: PowerDocument = {
      name: 'Versions',
      composition: {
        structure: 'alternate',
        variants: [
          {
            id: 'far',
            label: 'Far',
            actionType: 'basic',
            range: { steps: 3 },
            parts: immobile,
          },
          {
            id: 'near',
            label: 'Near',
            actionType: 'basic',
            range: { steps: 1 },
            parts: [{ id: 902, name: 'Blinded' }],
          },
        ],
      },
    };
    const alternate = resolvePowerComposition(alternateDoc, db)!;
    expect(alternate.variants.every((v) => v.rangeEnergy === 0)).toBe(true);
    expect(resolvePowerComposition(alternateDoc, db, { selectedVariantId: 'near' })!.energy).toBe(
      derivePlainPowerDisplay(
        { actionType: 'basic', range: { steps: 1 }, parts: [{ id: 902, name: 'Blinded' }] },
        db,
      ).energy,
    );
  });

  it('Reverse prices the drawback at a smaller footprint than Shared', () => {
    const db = partsDb;
    const sharedArea = { type: 'sphere' as const, level: 2 };
    const base: PowerDocument = {
      name: 'Ward',
      actionType: 'basic',
      range: { steps: 2 },
      area: sharedArea,
      parts: [{ id: 901, name: 'Slow' }],
    };
    const inherited = resolvePowerComposition(
      {
        ...base,
        composition: {
          structure: 'none',
          variants: [],
          reverse: { parts: [{ id: 902, name: 'Blinded' }] },
        },
      },
      db,
    )!;
    const smaller = resolvePowerComposition(
      {
        ...base,
        composition: {
          structure: 'none',
          variants: [],
          reverse: {
            area: { type: 'none', level: 1 },
            parts: [{ id: 902, name: 'Blinded' }],
          },
        },
      },
      db,
    )!;
    expect(smaller.reverse!.rawEnergy).toBeLessThan(inherited.reverse!.rawEnergy);
    expect(smaller.reverse!.actionMultiplier).toBe(1);
    expect(smaller.reverse!.discount).toBeCloseTo(smaller.reverse!.rawEnergy / 2);
  });

  it('refunds more energy when a drawback takes longer to harm you', () => {
    const db: PowerPart[] = [
      ...partsDb,
      part({ id: '920', name: 'Drawback', base_en: 4 }),
      part({ id: '921', name: 'Benefit', base_en: 20 }),
    ];
    const actions = ['free', 'quick', 'basic', 'long4'] as const;
    const expected = [2 / 1.5, 2 / 1.25, 2, 2 / 0.75];
    const discounts = actions.map((actionType) => {
      const res = resolvePowerComposition(
        {
          name: 'Harm',
          actionType,
          parts: [{ id: 921, name: 'Benefit' }],
          composition: {
            structure: 'none',
            variants: [],
            reverse: { parts: [{ id: 920, name: 'Drawback' }] },
          },
        },
        db,
      )!;
      return res.reverse!.discount;
    });
    discounts.forEach((discount, index) => expect(discount).toBeCloseTo(expected[index]!));
    expect(discounts[0]!).toBeLessThan(discounts[1]!);
    expect(discounts[1]!).toBeLessThan(discounts[2]!);
    expect(discounts[2]!).toBeLessThan(discounts[3]!);

    const badDeltas = actions.map((actionType) => {
      const res = resolvePowerComposition(
        {
          name: 'Wild',
          actionType,
          parts: [{ id: 921, name: 'Benefit' }],
          composition: {
            structure: 'randomize',
            variants: [
              independentFace({
                id: 'bad',
                label: 'Bad',
                polarity: 'negative',
                parts: [{ id: 920, name: 'Drawback' }],
              }),
            ],
            die: { sides: 2, faces: ['bad', 'bad'] },
          },
        },
        db,
      )!;
      return res.structureEnergy;
    });
    badDeltas.forEach((delta, index) => {
      expect(delta).toBeCloseTo(-expected[index]!);
      expect(delta).toBeCloseTo(-drawbackReductionForAction(4, [1.5, 1.25, 1, 0.75][index]!));
    });
    expect(badDeltas[0]!).toBeGreaterThan(badDeltas[3]!);
  });

  it('shows unrounded Reverse intermediates in the breakdown', () => {
    const db: PowerPart[] = [
      ...partsDb,
      part({ id: '930', name: 'Benefit', base_en: 6.25 }),
      part({ id: '931', name: 'Drawback', base_en: 4.5 }),
    ];
    const res = resolvePowerComposition(
      {
        name: 'Ward',
        actionType: 'basic',
        parts: [{ id: 930, name: 'Benefit' }],
        composition: {
          structure: 'none',
          variants: [],
          reverse: { parts: [{ id: 931, name: 'Drawback' }] },
        },
      },
      db,
    )!;
    expect(res.reverse!.rawEnergy).toBeCloseTo(4.5);
    expect(res.reverse!.discount).toBeCloseTo(2.25);
    expect(res.energy).toBe(4);
    const lines = powerCompositionEnergyLines(res);
    expect(lines).toContain('Reverse drawback 4.5 EN → −2.25 EN');
    expect(lines.at(-1)).toBe('Total: 4 EN');
    expect(formatEnergyIntermediate(0.875)).toBe('0.88');
    expect(formatEnergyIntermediate(-2)).toBe('−2');
    expect(formatEnergyIntermediate(-1.5)).toBe('−1.5');
  });

  it('prints a long action multiplier as 0.875', () => {
    expect(reverseActionDivisorNote(0.875)).toBe(', divided by the action multiplier 0.875');
    expect(reverseActionDivisorNote(0.875)).not.toContain('0.88');
  });

  it('Judgement-shaped Choice prices each portion from the Codex snapshot', () => {
    const db = loadRepoCodexParts();
    const res = resolvePowerComposition(
      {
        name: 'Judgement',
        actionType: 'basic',
        area: { type: 'sphere', level: 1 },
        composition: {
          structure: 'choice',
          variants: [
            { id: 'light', label: 'Light', damage: [{ amount: 1, size: 6, type: 'light' }] },
            {
              id: 'necrotic',
              label: 'Necrotic',
              damage: [{ amount: 1, size: 6, type: 'necrotic' }],
            },
          ],
        },
      },
      db,
    )!;
    expect(res.energy).toBe(
      finalizePowerEnergy(
        (res.shared?.rawEnergy ?? 0) + Math.max(...res.variants.map((v) => v.energyRaw)),
        true,
      ),
    );
    const chips = buildPowerVariantChips(res);
    for (const [index, chip] of chips.entries()) {
      expect(chip.description?.startsWith(`${res.variants[index]!.energy} Energy`)).toBe(true);
      expect(res.variants[index]!.energy).toBe(
        finalizePowerEnergy((res.shared?.rawEnergy ?? 0) + res.variants[index]!.energyRaw),
      );
    }
    expect(Math.max(...res.variants.map((v) => v.energy))).toBe(res.energy);
    const light = res.variants.find((v) => v.id === 'light')!;
    const necrotic = res.variants.find((v) => v.id === 'necrotic')!;
    expect(light.energyRaw).toBe(5);
    expect(formatEnergyIntermediate(necrotic.energyRaw)).toBe('5.63');
    expect(light.energy).toBe(finalizePowerEnergy(light.energyRaw));
    expect(necrotic.energy).toBe(finalizePowerEnergy(necrotic.energyRaw));
    expect(light.energy).toBe(5);
    expect(necrotic.energy).toBe(6);
    expect(res.energy).toBe(necrotic.energy);
  });

  it('expands a legacy overlay Randomize on read into independent faces', () => {
    const doc: PowerDocument = {
      name: 'Old coin',
      actionType: 'quick',
      range: { steps: 2 },
      duration: { type: 'rounds', value: 2 },
      parts: [{ id: 900, name: 'Immobile' }],
      composition: {
        structure: 'randomize',
        variants: [
          {
            id: 'good',
            label: 'Good',
            polarity: 'positive',
            parts: [{ id: 901, name: 'Slow', op_1_lvl: 1 }],
          },
          { id: 'bad', label: 'Bad', polarity: 'negative' },
        ],
        die: { sides: 2, faces: ['good', 'bad'] },
      },
    };
    const res = resolvePowerComposition(doc, partsDb)!;
    const good = res.variants.find((v) => v.id === 'good')!;
    const bad = res.variants.find((v) => v.id === 'bad')!;
    expect(good.doc.parts?.map((p) => p.id)).toEqual([900, 901]);
    expect(bad.doc.parts?.map((p) => p.id)).toEqual([900]);
    expect(good.doc.range).toEqual({ steps: 2 });
    expect(bad.doc.duration).toEqual({ type: 'rounds', value: 2 });
    expect(good.doc.actionType).toBe('quick');
    expect(bad.doc.actionType).toBe('quick');
    const expandedGood = rawEnergy({
      actionType: 'quick',
      range: { steps: 2 },
      duration: { type: 'rounds', value: 2 },
      parts: [
        { id: 900, name: 'Immobile' },
        { id: 901, name: 'Slow', op_1_lvl: 1 },
      ],
    });
    const expandedBad = rawEnergy({
      actionType: 'basic',
      isReaction: false,
      range: { steps: 2 },
      duration: { type: 'rounds', value: 2 },
      parts: [{ id: 900, name: 'Immobile' }],
    });
    expect(good.energyRaw).toBeCloseTo(expandedGood);
    expect(bad.energyRaw).toBeCloseTo(-drawbackReductionForAction(expandedBad, 1.25));
    expect(res.energy).toBeGreaterThan(0);
    expect(res.shared?.rawEnergy).toBeGreaterThan(0);
    expect(res.structureEnergy).toBeCloseTo((good.energyRaw + bad.energyRaw) / 2);

    const alreadyIndependent = resolvePowerComposition(
      {
        ...doc,
        composition: {
          structure: 'randomize',
          variants: [
            {
              id: 'good',
              label: 'Good',
              parts: [{ id: 901, name: 'Slow', op_1_lvl: 1 }],
              range: { steps: 0 },
              area: { type: 'none', level: 1 },
              duration: { type: 'instant', value: 1 },
              damage: [],
            },
          ],
          die: { sides: 2, faces: ['good', 'good'] },
        },
      },
      partsDb,
    )!;
    expect(alreadyIndependent.variants[0]?.doc.parts?.map((p) => p.id)).toEqual([901]);
    expect(alreadyIndependent.variants[0]?.doc.range).toEqual({ steps: 0 });
    expect(alreadyIndependent.variants[0]?.doc.damage).toEqual([]);
  });

  it('converts a legacy Randomize overlay so each face keeps Shared range and damage', () => {
    const db = [...partsDb, ...snapshotParts([PART_IDS.MAGIC_DAMAGE])];
    const damage = [{ amount: 1, size: 4, type: 'magic' }];
    const doc: PowerDocument = {
      name: 'QA PC126 Randomize',
      actionType: 'basic',
      range: { steps: 1 },
      damage,
      composition: {
        structure: 'randomize',
        variants: [
          { id: 'a', label: 'A', polarity: 'positive' },
          { id: 'b', label: 'B', polarity: 'positive', range: { steps: 0 }, damage: [] },
        ],
        die: { sides: 2, faces: ['a', 'b'] },
      },
    };
    const res = resolvePowerComposition(doc, db)!;
    for (const face of res.variants) {
      expect(face.doc.range).toEqual({ steps: 1 });
      expect(face.doc.damage).toEqual(damage);
    }
    const display = derivePowerDisplay(doc, db)!;
    const atSharedRange = derivePlainPowerDisplay(
      { name: doc.name, actionType: 'basic', range: { steps: 1 }, damage },
      db,
    );
    const atOneSpace = derivePlainPowerDisplay({ name: doc.name, actionType: 'basic', damage }, db);
    expect(display.range).toBe('3 spaces');
    expect(display.range).not.toBe('1 space');
    expect(atSharedRange.energy).not.toBe(atOneSpace.energy);
    expect(display.energy).toBe(atSharedRange.energy);
    expect(powerCompositionEnergyLines(res)[0]).toBe('Shared: not priced');
    expect(powerCompositionHelpText('randomize')).toContain(
      'Changing Shared later does not change a face that already exists.',
    );

    const rolled = resolvePowerComposition(doc, db, { selectedVariantId: 'b' })!;
    expect(composedPowerDamage(rolled)).toEqual(damage);
    expect(derivePowerDisplay(doc, db, { selectedVariantId: 'b' })?.range).toBe('3 spaces');
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
